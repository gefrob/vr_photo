const vertexShader = `
  precision highp float;
  varying vec2 vUv;

  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D map;
  uniform vec3 background;
  uniform vec3 fill;
  uniform float progress;

  varying vec2 vUv;

  void main() {
      vec4 diffuseColor = texture2D( map, vUv );
      vec3 color = mix(fill, background ,step(progress, vUv.x));
      diffuseColor *= vec4(color, 1.0);

      gl_FragColor = diffuseColor;
  }
`;

class Button extends THREE.Mesh {
	constructor(params) {
		const {
			width,
			height,
			texture,
			backgroundColor,
			gazeProgressColor
		} = params;
		const geometry = new THREE.PlaneGeometry(width, height);

		const uniforms = {
			"map": {value: new THREE.TextureLoader().load(texture)},
			"background": {value: new THREE.Color(backgroundColor)},
			"fill": {value: new THREE.Color(gazeProgressColor)},
			"progress": {value: 0.0}
		};

		const material = new THREE.ShaderMaterial( {
			uniforms,
			vertexShader,
			fragmentShader,
			transparent: true
		});

		super(geometry, material);
		this.params = params;
	}

	setHighlight(flag) {
		const color = flag ? this.params.highlightColor : this.params.backgroundColor;
		this.material.uniforms.background.value.set(color);
	}

	setProgress(progress) {
		this.material.uniforms.progress.value = progress;
	}
}

export default Button;
