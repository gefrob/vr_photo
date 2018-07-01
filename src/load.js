async function load(params) {
	if (typeof params.image === "string") {
		const {texture, tags} = await loadTexture(params.image);
		const newParams = geometryParameters(texture, tags, params);
		newParams.texture = texture;
		newParams.image = params.image;
		newParams.stereo = false;
		return newParams;
	} else {
		const leftTexturePromise = loadTexture(params.image.left);
		const rightTexturePromise = loadTexture(params.image.right);
		const left = await leftTexturePromise;
		const right = await rightTexturePromise;


		if (left.tags.PixelXDimension.value == right.tags.PixelXDimension.value &&
      left.tags.PixelYDimension.value == right.tags.PixelYDimension.value
		) {
			geometryParameters(left.texture, left.tags, params);
			const newParams = geometryParameters(right.texture, right.tags, params);
			newParams.texture = {
				left: left.texture,
				right: right.texture
			};
			newParams.image = params.image;
			newParams.stereo = true;
			return newParams;
		} else {
			throw new Error("Missmatching size");
		}
	}
}

async function loadTexture(url) {
	const blob = await loadBlob(url);
	const tags = await readFile(blob);
	const texture = createTexture(blob);
	setOrientation(texture, tags);

	return {texture, tags};
}

function loadBlob(url) {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "blob";

		xhr.onerror = (event) => {
			throw new Error(event.message);
		};

		xhr.onload = () => {
			const blob = xhr.response;
			resolve(blob);
		};

		xhr.send();
	});
}

function readFile(blob) {
	return new Promise((resolve) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			let tags;
			try {
				tags = ExifReader.load(event.target.result);
			} catch (error) {
				throw new Error(error);
			}

			resolve(tags);
		};

		reader.readAsArrayBuffer(blob.slice(0, 128*1024));
	});
}

function createTexture(blob) {
	const texture = new THREE.Texture();
	const image = document.createElementNS( "http://www.w3.org/1999/xhtml", "img" );

	image.onload = () => {
		texture.image = image;
		texture.format = THREE.RGBFormat;
		texture.needsUpdate = true;
	};

	image.onerror = (event) => {
		throw new Error(event.message);
	};

	image.src = URL.createObjectURL(blob);
	return texture;
}

function setOrientation(texture, tags) {
	if (tags.Orientation) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		switch(tags.Orientation.value) {
		case 3:
			texture.rotation = Math.PI;
			break;
		case 6:
			texture.rotation = -Math.PI/2;
			break;
		case 8:
			texture.rotation = -3*Math.PI/2;
		}
		texture.needsUpdate = true;
	}
}

function geometryParameters(texture, tags, params) {
	const geometryParams = {
		sphere: tags && tags.ProjectionType && tags.ProjectionType.value === "equirectangular"
	};

	if (geometryParams.sphere) {
		makeGPano(texture, tags);
	} else {
		const {width, height} = getMeshSize(params, tags);
		geometryParams.width = width;
		geometryParams.height = height;
	}

	return geometryParams;
}

function makeGPano(texture, tags) {
	const left = tags.CroppedAreaLeftPixels.value;
	const top = tags.CroppedAreaTopPixels.value;
	const croppedWidth = tags.CroppedAreaImageWidthPixels.value;
	const croppedHeight = tags.CroppedAreaImageHeightPixels.value;
	const fullWidth = tags.FullPanoWidthPixels.value;
	const fullHeight = tags.FullPanoHeightPixels.value;

	texture.repeat.x = fullWidth/croppedWidth;
	texture.repeat.y = fullHeight/croppedHeight;
	texture.offset.x = -(left/fullWidth);
	texture.offset.y = -((fullHeight-top)/fullHeight);
}

function getMeshSize(params, tags) {
	let width = params.width;
	let height = params.height;

	if (!(width || height)) {
		throw new Error("Neither width nor height provided");
	}

	if (!(width && height)) {
		if (!(("PixelXDimension" in tags ) && ("PixelXDimension" in tags ))) {
			throw new Error("No pixel dimensions in exif tags");
		}

		const pixelWidth = tags.PixelXDimension.value;
		const pixelHeight = tags.PixelYDimension.value;


		const ratio = tags.Orientation.value < 5 ? pixelWidth/pixelHeight : pixelHeight/pixelWidth;

		if (!width) width = height*ratio;
		if (!height) height = width/ratio;
	}

	return {width, height};
}

export default load;
