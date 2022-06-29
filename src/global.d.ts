type UserScene = {
  root: THREE.Object3D
  selectedObject: THREE.Object3D | undefined
  selected: Array<string>
  setSelected: Function
  scrollToObject: Function
  focusToObject: Function
  url: string
  setUrl: Function
}
