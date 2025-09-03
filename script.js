let scene, camera, renderer, stars;
let mouse = new THREE.Vector2(-1000, -1000);
let interactionRadius = 80;

const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform sampler2D pointTexture;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
    if (gl_FragColor.a < 0.1) discard;
  }
`;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() * 2 - 1) * 1500;
        positions[i * 3 + 1] = (Math.random() * 2 - 1) * 1500;
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * 1500;

        color.setHSL(Math.random() * 0.1 + 0.5, 0.9, 0.7);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 10 + 5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png') }
        },
        vertexShader,
        fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.00005;
    stars.rotation.y = time * 0.1;
    stars.rotation.x = time * 0.05;

    const positions = stars.geometry.attributes.position.array;
    const sizes = stars.geometry.attributes.size.array;

    for (let i = 0; i < positions.length; i += 3) {
        // Simple twinkling effect by varying size
        let originalSize = stars.geometry.attributes.size.getX(i / 3);
        sizes[i / 3] = originalSize * (0.5 + Math.sin(time * 5.0 + positions[i] * 0.1) * 0.5);
    }
    stars.geometry.attributes.size.needsUpdate = true;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // A subtle camera pan effect based on mouse position
    mouse.x = (event.clientX - window.innerWidth / 2) * 0.2;
    mouse.y = (event.clientY - window.innerHeight / 2) * 0.2;
    camera.position.x += (mouse.x - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
}

init();
