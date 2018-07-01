const planeGeometry = new THREE.PlaneGeometry(1, 1);
const sphereGeometry = new THREE.SphereGeometry(10, 32, 32);
sphereGeometry.rotateY(Math.PI);
sphereGeometry.scale(-1, 1, 1);

const createMesh = (layer, geometry, side) => {
	const material = new THREE.MeshBasicMaterial({side});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.layers.set(layer);
	return mesh;
};

const createGroup = (geometry, side) => {
	const group = new THREE.Group();
	group.lMesh = createMesh(1, geometry, side);
	group.rMesh = createMesh(2, geometry, side);
	group.add(group.lMesh, group.rMesh);
	return group;
};

class Photo extends THREE.Group {
	constructor(image) {
		super();

		this.groups = {
			plane: createGroup(planeGeometry, THREE.FrontSide),
			sphere: createGroup(sphereGeometry, THREE.FrontSide)
		};
		this.groups.sphere.visible = false;
		this.currentGroup = this.groups.plane;
		this.add(this.groups.plane, this.groups.sphere);
		this.vr = false;

		if (image) {
			this.setImage(image);
		}
	}

	set vr(flag) {
		this._vr = flag;
		this.setStereo(this._vr);
	}

	setStereo(flag) {
		const stereo = flag && this._vr;
		this.currentGroup.rMesh.layers.set(stereo ? 2 : 0);
		this.currentGroup.lMesh.visible = stereo;
	}

	setObjects(params) {
		const projection = params.sphere ? "sphere" : "plane";

		const newGroup = this.groups[projection];
		if (newGroup !== this.currentGroup) {
			this.currentGroup.visible = false;
			newGroup.visible = true;
			this.currentGroup = newGroup;
		}

		if (!params.sphere) {
			this.setPlane(params.width, params.height);
		}
	}

	setPlane(width, height) {
		const planeGroup = this.groups.plane;
		planeGroup.lMesh.scale.set(width, height, 1);
		planeGroup.rMesh.scale.set(width, height, 1);
	}

	setImage(imageParams) {
		this.setObjects(imageParams);
		this.setStereo(imageParams.stereo);

		if (imageParams.stereo) {
			this.currentGroup.lMesh.material.map = imageParams.texture.left;
			this.currentGroup.rMesh.material.map = imageParams.texture.right;
		} else {
			this.currentGroup.rMesh.material.map = imageParams.texture;
		}

		this.currentImageParams = imageParams;
	}
}

export default Photo;
