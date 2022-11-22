import * as THREE from 'three'

class CombinedCamera extends THREE.Camera{
  constructor(width, height, fov, near, far, orthoNear, orthoFar) {
    super()

    this.fov = fov;

    this.far = far;
    this.near = near;

    this.left = -width / 2;
    this.right = width / 2;
    this.top = height / 2;
    this.bottom = -height / 2;

    this.aspect = width / height;
    this.zoom = 1;
    this.view = null;
    // We could also handle the projectionMatrix internally, but just wanted to test nested camera objects
    this.cameraO = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, orthoNear, orthoFar);
    this.cameraP = new THREE.PerspectiveCamera(fov, width / height, near, far);

    this.toPerspective();

  }
  toPerspective() {
    // Switches to the Perspective Camera

    this.near = this.cameraP.near;
    this.far = this.cameraP.far;

    // this.cameraP.aspect = this.aspect;
    // this.cameraP.fov = this.fov / this.zoom;
    // add
    this.cameraP.fov = this.fov / 1;
    this.cameraP.view = this.view;

    this.cameraP.updateProjectionMatrix();
    this.projectionMatrix = this.cameraP.projectionMatrix;
    // add to fit raycaster
    this.projectionMatrixInverse.copy( this.projectionMatrix ).invert();

    this.inPerspectiveMode = true;
    this.inOrthographicMode = false;
    this.isPerspectiveCamera = true;
    this.isOrthographicCamera = false;

  }
  toOrthographic() {
    // Switches to the Orthographic camera estimating viewport from Perspective

    var fov = this.fov;
    var aspect = this.cameraP.aspect;
    var near = this.cameraP.near;
    var far = this.cameraP.far;

    // The size that we set is the mid plane of the viewing frustum
    var hyperfocus = (near + far) / 2;

    var halfHeight = Math.tan(fov * Math.PI / 180 / 2) * hyperfocus;
    var halfWidth = halfHeight * aspect;

    // halfHeight /= this.zoom;
    // halfWidth /= this.zoom;
    // add
    let magic_number = 800
    halfHeight /= ((this.cameraP.far/magic_number)*this.zoom);
    halfWidth /= ((this.cameraP.far/magic_number)*this.zoom);

    this.cameraO.left = -halfWidth;
    this.cameraO.right = halfWidth;
    this.cameraO.top = halfHeight;
    this.cameraO.bottom = -halfHeight;
    this.cameraO.view = this.view;
    // add
    this.cameraO.far = this.cameraP.far+((this.cameraP.far/25)*this.zoom)-0.5;

    this.cameraO.updateProjectionMatrix();

    this.near = this.cameraO.near;
    this.far = this.cameraO.far;
    this.projectionMatrix = this.cameraO.projectionMatrix;
    // add to fit raycaster
    this.projectionMatrixInverse.copy( this.projectionMatrix ).invert();

    this.inPerspectiveMode = false;
    this.inOrthographicMode = true;
    this.isPerspectiveCamera = false;
    this.isOrthographicCamera = true;

  }
  copy(source) {

    THREE.Camera.prototype.copy.call(this, source);

    this.fov = source.fov;
    this.far = source.far;
    this.near = source.near;

    this.left = source.left;
    this.right = source.right;
    this.top = source.top;
    this.bottom = source.bottom;

    this.zoom = source.zoom;
    this.view = source.view === null ? null : Object.assign({}, source.view);
    this.aspect = source.aspect;

    this.cameraO.copy(source.cameraO);
    this.cameraP.copy(source.cameraP);

    this.inOrthographicMode = source.inOrthographicMode;
    this.inPerspectiveMode = source.inPerspectiveMode;

    return this;

  }
  setViewOffset(fullWidth, fullHeight, x, y, width, height) {

    this.view = {
      fullWidth: fullWidth,
      fullHeight: fullHeight,
      offsetX: x,
      offsetY: y,
      width: width,
      height: height
    };

    if (this.inPerspectiveMode) {

      this.aspect = fullWidth / fullHeight;

      this.toPerspective();

    } else {

      this.toOrthographic();

    }

  }
  clearViewOffset() {

    this.view = null;
    this.updateProjectionMatrix();

  }
  setSize(width, height) {

    this.cameraP.aspect = width / height;
    this.left = -width / 2;
    this.right = width / 2;
    this.top = height / 2;
    this.bottom = -height / 2;

  }
  setFov(fov) {

    this.fov = fov;

    if (this.inPerspectiveMode) {

      this.toPerspective();

    } else {

      this.toOrthographic();

    }

  }
  // For maintaining similar API with PerspectiveCamera
  updateProjectionMatrix() {
    
    if (this.inPerspectiveMode) {

      this.toPerspective();

    } else {

      this.toPerspective();
      this.toOrthographic();

    }

  }
  /*
  * Uses Focal Length (in mm) to estimate and set FOV
  * 35mm (full frame) camera is used if frame size is not specified;
  * Formula based on http://www.bobatkins.com/photography/technical/field_of_view.html
  */
  setLens(focalLength, filmGauge) {

    if (filmGauge === undefined)
      filmGauge = 35;

    var vExtentSlope = 0.5 * filmGauge /
      (focalLength * Math.max(this.cameraP.aspect, 1));
    var fov = THREE.MathUtils.RAD2DEG * 2 * Math.atan(vExtentSlope);

    this.setFov(fov);

    return fov;

  }
  setZoom(zoom) {

    this.zoom = zoom;

    if (this.inPerspectiveMode) {

      this.toPerspective();

    } else {

      this.toOrthographic();

    }

  }
  toFrontView() {

    this.rotation.x = 0;
    this.rotation.y = 0;
    this.rotation.z = 0;

    // should we be modifing the matrix instead?
  }
  toBackView() {

    this.rotation.x = 0;
    this.rotation.y = Math.PI;
    this.rotation.z = 0;

  }
  toLeftView() {

    this.rotation.x = 0;
    this.rotation.y = -Math.PI / 2;
    this.rotation.z = 0;

  }
  toRightView() {

    this.rotation.x = 0;
    this.rotation.y = Math.PI / 2;
    this.rotation.z = 0;

  }
  toTopView() {

    this.rotation.x = -Math.PI / 2;
    this.rotation.y = 0;
    this.rotation.z = 0;

  }
  toBottomView() {

    this.rotation.x = Math.PI / 2;
    this.rotation.y = 0;
    this.rotation.z = 0;

  }

  dollyIn( dollyScale ) {

    if ( dollyScale === undefined ) {

        dollyScale = this.getZoomScale();

    }

    this.scale /= dollyScale;
    this.scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
  };

  dollyOut( dollyScale ) {

      if ( dollyScale === undefined ) {

          dollyScale = this.getZoomScale();

      }

      this.scale *= dollyScale;
      this.scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
  };
}

export {CombinedCamera}