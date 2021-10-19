document.getElementById("startRecordingbtn").onclick = function () {
  startRecording();
};

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const expressions = {};
const expressionsPercentage = {};
let isRecording = false;
let iterationCount = 0;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  document.body.append(canvas);
  // Change display size of drawing
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    // Start recording only if its called
    if (isRecording) {
      console.log(detections[0].expressions);
      Object.keys(detections[0].expressions).map((expression) => {
        if (!expressions[expression]) {
          expressions[expression] = 0;
        }
        if (detections[0].expressions[expression]) {
          expressions[expression] += detections[0].expressions[expression];
        }
      });
      console.log(expressions);
      iterationCount++;
      console.log(iterationCount);

      // End recording after 10 seconds
      if (iterationCount == 100) {
        isRecording = false;
        iterationCount = 0;
        console.log("Recording stopped");
        document.getElementById("recordingStatus").innerHTML =
          "Recording is currently off.";
        document.getElementById("recordingStatus").style.color = "red";
        console.log(expressions);
        createTable();
      }
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
});

function startRecording() {
  console.log("started");
  isRecording = true;
  $("#tableData tr").remove();
  for (var member in expressions) delete expressions[member];
  document.getElementById("recordingStatus").innerHTML =
    "Recording is currently on.";
  document.getElementById("recordingStatus").style.color = "green";
}

function createTable() {
  var k = "<tbody>";

  console.log("this is the final expressions object");
  console.log(expressions);
  let totalExpressionsValue = findTotalValue();
  console.log(parseInt(totalExpressionsValue) + " this is the total value");
  calculatePercentage(parseInt(totalExpressionsValue));
  console.log("This is the percentages");
  console.log(expressions);
  k += "<tr>";
  k += insertRows("angry");
  k += insertRows("disgusted");
  k += insertRows("fearful");
  k += insertRows("happy");
  k += insertRows("neutral");
  k += insertRows("sad");
  k += insertRows("surprised");

  k += "</tbody>";
  document.getElementById("tableData").innerHTML = k;
}

function insertRows(expression) {
  return (
    "<td>" +
    expression +
    "</td>" +
    "<td>" +
    expressions[expression] +
    "%" +
    "</td>" +
    "</tr>"
  );
}

function findTotalValue() {
  var total = 0;
  for (var i in expressions) {
    // Calculate total
    total += parseInt(expressions[i], 10);
  }
  return total;
}

function calculatePercentage(totalExpressionsValue) {
  for (var i in expressions) {
    // Calculate percentage
    expressions[i] = parseInt(
      (parseInt(expressions[i]) / totalExpressionsValue) * 100
    );
  }
}
