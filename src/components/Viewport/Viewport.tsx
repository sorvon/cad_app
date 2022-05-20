import React, { Component, createRef, PropsWithChildren, RefObject } from 'react'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as THREE from 'three'
import { AmbientLight, PointLight, Vector2 } from 'three'
import axios from 'axios';
import './Viewport.css'


type Props = {
  userScene: THREE.Object3D
}

type State = {}

export class Viewport extends Component<Props, State> {
  webglOutput : RefObject<HTMLDivElement> = createRef()
  renderer = new THREE.WebGLRenderer()
  camera = new THREE.PerspectiveCamera()
  scene = new THREE.Scene()

  componentDidMount(){
    if(this.webglOutput.current === null){
      return
    }
    
    while(this.webglOutput.current.firstChild !== null){
      this.webglOutput.current.removeChild(this.webglOutput.current.firstChild)
    }
    this.webglOutput.current.appendChild(this.renderer.domElement)
    this.renderer.setSize(this.webglOutput.current.offsetWidth, this.webglOutput.current.offsetHeight)
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    this.camera.aspect = this.webglOutput.current.offsetWidth / this.webglOutput.current.offsetHeight
    this.camera.updateProjectionMatrix();

    this.camera.position.set( 20, 20, 20 );
    this.camera.lookAt(this.scene.position)
    this.scene.add(this.camera)
    this.scene.add(this.props.userScene)

    const axesHelper = new THREE.AxesHelper( 50 );
    this.scene.add( axesHelper );


    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    this.scene.add(ambientLight)

    const cameraLight = new PointLight(0xffffff, 0.8)
    this.camera.add(cameraLight)

    const texture = new THREE.TextureLoader().load("gradient.png")
    texture.sourceFile = "gradient.png"
    // texture.needsUpdate = true;
    
    this.scene.background = texture 

    const controls = new OrbitControls( this.camera, this.renderer.domElement );
    controls.update()
    
    
    this.renderer.setAnimationLoop(this.animate)

    window.addEventListener( 'resize', this.onWindowResize );
    
  }

  animate =  () => {
    this.renderer.render( this.scene, this.camera );
  }
  
  onWindowResize = () => {
    if(this.webglOutput.current === null){
      return
    }
    this.camera.aspect = this.webglOutput.current.offsetWidth / this.webglOutput.current.offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( this.webglOutput.current.offsetWidth , this.webglOutput.current.offsetHeight );
    console.log(this.webglOutput.current.clientWidth, this.webglOutput.current.clientHeight)
  }
  render() {
    return (
      <div className='Viewport' ref={this.webglOutput}>
      </div>
        
     
    )
  }
}