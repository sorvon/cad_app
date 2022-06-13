type UserScene = {
  root: THREE.Object3D
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  selectedObject: THREE.Object3D | undefined
  selected: Array<string>
  setSelected: Function
  scrollToObject: Function
  focusToObject: Function
  url: string
  setUrl: Function
}
