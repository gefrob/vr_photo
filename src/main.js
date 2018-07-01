import Photo from "./Photo.js";
import Button from "./ArrowButton.js";
import images from "./images.js";
import load from "./load.js";

var camera, scene, renderer;

init();
async function init () {
	scene = new THREE.Scene();
	scene.background = new THREE.Color("#0E0E0E");
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
	const sceneObjects = new THREE.Group();
	sceneObjects.position.z = -1.5;

	scene.add(camera, sceneObjects);

	renderer = new THREE.WebGLRenderer({antialias: true});

	renderer.vr.enabled = true;
	renderer.vr.userHeight = 0;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	//
	window.addEventListener("resize", onWindowResize, false);
	document.body.appendChild(WEBVR.createButton(renderer));

	let currentVRDisplay;
	if (navigator.getVRDisplays) {
		navigator.getVRDisplays().then((displays) => {
			if (displays.length > 0) {
				currentVRDisplay = displays[0];
				if (currentVRDisplay.stageParameters) {
					const m = new THREE.Matrix4();
					const v = new THREE.Vector3();
					m.fromArray(currentVRDisplay.stageParameters.sittingToStandingTransform);
					v.setFromMatrixPosition(m);
					sceneObjects.position.add(v);
				}
			}
		});
	}

	Reticulum.init(camera, {
		proximity: false,
		fuse: {
			visible: false,
			duration: 1,
			coolDown: 0.25,
			vibrate: 0
		}
	});

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.position.set( 1, 1, 3 );

	const side = 0.5;
	const geometry = new THREE.BoxGeometry(side, side ,side);
	const material = new THREE.MeshLambertMaterial();
	const loadingCube = new THREE.Mesh(geometry, material);
	loadingCube.onBeforeRender = () => {
		loadingCube.rotateX(Math.PI/400);
		loadingCube.rotateY(Math.PI/350);
		loadingCube.rotateZ(Math.PI/690);
	};

	const photo = new Photo();
	photo.visible = false;

	const controls = new THREE.Group();
	controls.position.set(0, -0.9, 0);
	controls.visible = false;
	sceneObjects.add(controls);

	sceneObjects.add(loadingCube, directionalLight, photo, controls);
	window.addEventListener("vrdisplaypresentchange", () => {
		const presenting = currentVRDisplay.isPresenting;
		photo.vr = presenting;
		controls.visible = presenting;
	});

	animate();

	const textures = await Promise.all(images.map((image) => {
		if (!(image.height || image.width)) {
			image.height = image.height || 1.5;
		}

		return load(image);
	})).catch((reject) => {
		throw new Error(reject);
	});

	let currentTextureIndex = 0;
	photo.visible = true;
	photo.setImage(textures[currentTextureIndex]);

	sceneObjects.remove(loadingCube, directionalLight);

	const nextImage = () => {
		if (++currentTextureIndex == textures.length) {
			currentTextureIndex = 0;
		}

		photo.setImage(textures[currentTextureIndex]);
	};

	const previousImage = () => {
		if (--currentTextureIndex < 0) {
			currentTextureIndex = textures.length - 1;
		}

		photo.setImage(textures[currentTextureIndex]);
	};

	document.addEventListener("keydown", (event) => {
		if (event.keyCode == 39) {
			nextImage();
		} else if (event.keyCode == 37) {
			previousImage();
		}
	});

	const buttonParams = {
		width: 0.4,
		height: 0.2,
		texture: "./images/arrow.png",
		backgroundColor: "white",
		highlightColor: "yellow",
		gazeProgressColor: "blue"
	};

	const nextButton = new Button(buttonParams);
	controls.add(nextButton);
	nextButton.position.x = 0.5;

	const previousButton = new Button(buttonParams);
	controls.add(previousButton);
	previousButton.rotation.z = Math.PI;
	previousButton.position.x = -0.5;

	const getGazeParameters = function(button, onGazeLong) {
		return {
			onGazeOver: function(){
				button.setHighlight(true);
			},
			onGazeOut: function(){
				button.setHighlight(false);
				button.setProgress(0);
			},
			onGazeLongProgress: function(progress){
				button.setProgress(progress);
			},
			onGazeLong
		};
	};

	Reticulum.add( nextButton, getGazeParameters(nextButton, nextImage));
	Reticulum.add( previousButton, getGazeParameters(previousButton, previousImage));
}

function onWindowResize () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function render () {
	renderer.render(scene, camera);
	Reticulum.update();
}

function animate () {
	renderer.setAnimationLoop(render);
}
