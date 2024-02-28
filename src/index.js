import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";
import "./style.css";
import "./output.css";

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const url = "https://teachablemachine.withgoogle.com/models/tGDfR8Umt/";

let model, labelContainer, maxPredictions;

// Load the image model
async function init() {
  const modelURL = url + "model.json";
  const metadataURL = url + "metadata.json";

  const text = document.getElementById("dzText");

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // append elements to the DOM
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) {
    // and class labels
    labelContainer.appendChild(document.createElement("div"));
  }

  text.innerHTML = "사진 업로드 (클릭하거나 여기에 이미지를 드롭하세요.)";
}

async function predict() {
  // Wait model initializing
  if (!model) {
    return;
  }
  // Predict The Image
  const image = document.getElementById("img-element");
  const prediction = await model.predict(image, false);

  const labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = ""; // Clear previous results

  let highestPrediction = { probability: 0 }; // Track the highest probability

  prediction.forEach((pred) => {
    const container = document.createElement("div");

    const labelClassToKorean = {
      Skinny: "나대는",
      Fat: "뚱뚱한",
      nasty: "이기적인",
      dumb: "멍청한",
      ace: "에이스",
    };

    // Create label text
    const labelTextContainer = document.createElement("div");
    const labelName = document.createElement("p");
    const labelPred = document.createElement("p");
    labelName.textContent = `${labelClassToKorean[pred.className]} 상`;
    labelPred.textContent = `${(pred.probability * 100).toFixed(1)}%`;
    labelTextContainer.classList.add(
      "px-2",
      "mt-6",
      "mb-1",
      "flex",
      "justify-between",
      "items-center"
    );
    labelName.classList.add("text-lg", "font-mdeium", "text-gray-800");
    labelPred.classList.add("text-lg", "font-mdeium", "text-gray-800");
    labelTextContainer.append(labelName, labelPred);

    // Create the outer bar
    const progressBarContainer = document.createElement("div");
    progressBarContainer.classList.add(
      "w-full",
      "drop-shadow-md",
      "bg-gray-200",
      "border-4",
      "border-white",
      "rounded-full",
      "h-6"
    );

    // Create the inner bar (the actual progress)
    const progressBar = document.createElement("div");
    progressBar.classList.add(
      "h-4",
      "rounded-full",
      "transition-all",
      "ease-out",
      "duration-1000"
    );

    // Define custom colors for each className or decide based on other criteria
    const mainColors = {
      Skinny: "gradient-1",
      Fat: "gradient-2",
      nasty: "gradient-3",
      dumb: "gradient-4",
      ace: "gradient-5",
    };

    // Select color based on className or fallback to a default color
    const mainColorClass = mainColors[pred.className] || "bg-lime-200";

    // Apply the selected color class
    progressBar.classList.add(mainColorClass);

    if (pred.probability > highestPrediction.probability) {
      highestPrediction = pred; // Update if current probability is higher
    }

    // Calculate width, ensuring a minimum percentage for visibility
    let widthPercentage = pred.probability * 100;
    const minWidthPercentage = 1; // Set a minimum width (in %) for very small values
    if (widthPercentage < minWidthPercentage) {
      progressBar.style.width = `${minWidthPercentage}%`; // Apply minimum width
      progressBar.setAttribute("aria-valuenow", widthPercentage); // Preserve actual value for accessibility
    } else {
      progressBar.style.width = `${widthPercentage}%`;
    }

    // Adding Progress Bar to Screen
    progressBarContainer.appendChild(progressBar);

    container.appendChild(labelTextContainer);
    container.appendChild(progressBarContainer);

    labelContainer.appendChild(container);

    const resultContainer = document.getElementById("result-container");
    if (highestPrediction.className === "ace") {
      resultContainer.innerHTML = `사진 분석 결과<br/>당신은<span class="text-3xl sm:text-5xl font-bold text-main"> ${
        labelClassToKorean[highestPrediction.className]
      }</span> 입니다.`;
    } else {
      resultContainer.innerHTML = `사진 분석 결과<br/>당신은<span class="text-3xl sm:text-5xl font-bold text-main"> ${
        labelClassToKorean[highestPrediction.className]
      } 폐급</span> 입니다.`;
    }

    setTimeout(() => {
      labelContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);

    // Print Actuall % to Screen Events When User Hover The Progress Bar
    progressBarContainer.addEventListener("mouseenter", () => {
      labelPred.textContent = `${widthPercentage.toFixed(2)}%`;
    });

    progressBarContainer.addEventListener("mouseleave", () => {
      labelPred.textContent = `${widthPercentage.toFixed(1)}%`;
    });
  });
}

// Function to initialize the Dropzone component
function initDropzone() {
  const uploadDropzone = new Dropzone("#image-upload", {
    url: "/file-upload",
    autoProcessQueue: false,
    maxFiles: 1,
    maxFilesize: 10, // Set maximum file size in MBs
    uploadMultiple: false,
    acceptedFiles: "image/*", // Accept images only
    addRemoveLinks: true,
    parallelUploads: 1,
  });

  uploadDropzone.on("maxfilesexceeded", function (file) {
    this.removeAllFiles();
    this.addFile(file);
  });

  uploadDropzone.on("addedfile", function (file) {
    // Specify the max file size limit (10MB in bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

    if (file.size > MAX_FILE_SIZE) {
      // If file size is larger than allowed, display an error message
      DisplayError("이미지 파일의 크기가 너무 큽니다. (10MB 이하)");
      return;
    }

    // Hide any previous error messages
    if (!document.getElementById("error-area").classList.contains("hidden")) {
      HideError();
    }

    // Display the selected file in our display area:
    const displayArea = document.getElementById("display-area");

    // Visible Display area
    displayArea.classList.remove("hidden");

    // Create an img element and assign blob URL as src attribute
    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(file);

    // Adjust your desired styles for displayed image below:
    imgElement.id = "img-element";
    imgElement.classList.add(
      "w-auto",
      "h-auto",
      "mx-auto",
      "border",
      "border-gray-300",
      "rounded-lg",
      "p-4",
      "text-center"
    );

    displayArea.appendChild(imgElement);

    // Wait for the img src to be processed/rendered before prediction
    imgElement.onload = async () => {
      try {
        await predict(); // Call predict function after image is added
      } catch (error) {
        console.error("Help me, Developers! I'm in trouble! 😭", error);
        DisplayError(
          "이미지 분석 중 오류가 발생했습니다:",
          error.message || "Unknown Error!"
        );
      }
    };
  });

  uploadDropzone.on("removedfile", function (file) {
    const displayArea = document.getElementById("display-area");
    const labelContainer = document.getElementById("label-container");
    const resultContainer = document.getElementById("result-container");
    // Clear the image display area content
    displayArea.innerHTML = "";
    displayArea.classList.add("hidden");
    // Clear Result area content
    labelContainer.innerHTML = "";
    resultContainer.innerHTML = "";
  });
}

// Function to display error messages
function DisplayError(msg) {
  const errorContainer = document.getElementById("error-area");
  errorContainer.classList.remove("hidden"); // Show the error container
  errorContainer.textContent = `⚠️ ${msg} ⚠️`;
}

// Function to hide error messages
function HideError() {
  const errorContainer = document.getElementById("error-area");
  errorContainer.classList.add("hidden"); // Hide the error container
  errorContainer.textContent = ""; // Clear the error message
}

// Document ready function equivalent for vanilla JS
document.addEventListener("DOMContentLoaded", function () {
  initDropzone();
  init();
});
