import React, { RefObject, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { AmbientLight, PointLight } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './DetailView.css'

type Props = {
  detailObject: THREE.Object3D | undefined
}

export function DetailView({detailObject}: Props) {
  const webglOutput : RefObject<HTMLDivElement> = useRef(null)
  useEffect(()=>{
    if(!detailObject) return
    const renderer = new THREE.WebGLRenderer()
    const camera = new THREE.PerspectiveCamera()
    const scene = new THREE.Scene()
    const orbitControls = new OrbitControls(camera, renderer.domElement)
        
    if(webglOutput.current === null){
      return
    }
    
    while(webglOutput.current.firstChild !== null){
      webglOutput.current.removeChild(webglOutput.current.firstChild)
    }
    webglOutput.current.appendChild(renderer.domElement)
    renderer.setSize(webglOutput.current.offsetWidth, webglOutput.current.offsetHeight)
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight
    camera.near = 0.1
    camera.far = 20000
    camera.updateProjectionMatrix();

    camera.position.set( 0, 0, 40 );
    camera.lookAt(scene.position)
    scene.add(camera) 

    scene.add(detailObject.clone())

    const axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );   

    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    const cameraLight = new PointLight(0xffffff, 0.8)
    camera.add(cameraLight)

    const texture = new THREE.TextureLoader().load("gradient.png")
    texture.sourceFile = "gradient.png"
    texture.needsUpdate = true;
    
    scene.background = texture 
    
    renderer.setAnimationLoop(()=>{
      orbitControls.update()
      renderer.render(scene, camera)
    })

    window.addEventListener( 'resize', ()=>{
      if(webglOutput.current === null){
        return
      }
      camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( webglOutput.current.offsetWidth , webglOutput.current.offsetHeight );
      console.log(webglOutput.current.clientWidth, webglOutput.current.clientHeight)
    } );
  }, [detailObject])
    
  return (
    <div className='DetailView' ref={webglOutput} />
  )
}
