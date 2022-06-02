import React, { Component, createRef, PropsWithChildren, RefObject, useContext, useEffect, useRef } from 'react'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as THREE from 'three'
import { AmbientLight, PointLight, Vector2 } from 'three'
import { ViewHelper, EditorControls } from './ViewHelper';
import './Viewport.css'
import { UserSceneContext } from '../../App';
import {
  usePopupState,
  bindTrigger,
  bindMenu,
  bindContextMenu,
} from 'material-ui-popup-state/hooks'
import { Menu, MenuItem } from '@mui/material';

type Props = {}

export function Viewport({}: Props) {
  const userScene = useContext(UserSceneContext)
  const contextMenuState = usePopupState({ variant: 'popover', popupId: 'demoMenu' })
  const webglOutput : RefObject<HTMLDivElement> = useRef(null)
  const viewHelperRef : RefObject<HTMLDivElement> = useRef(null)
  // const rendererRef = useRef(new THREE.WebGLRenderer())
  const cameraRef = useRef(new THREE.PerspectiveCamera())
  const camera = cameraRef.current
  // const sceneRef = useRef(new THREE.Scene())
  const transformControlsRef = useRef<TransformControls>(null)
  const boxHelperRef = useRef(new THREE.BoxHelper( undefined ));
  const boxHelper = boxHelperRef.current

  
  useEffect(()=>{
    const renderer = new THREE.WebGLRenderer()
    
    const scene = new THREE.Scene()
    transformControlsRef.current = new TransformControls(camera, renderer.domElement)
    const transformControls = transformControlsRef.current
    
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
    camera.far = 20000
    camera.updateProjectionMatrix();

    camera.position.set( 0, 0, 400 );
    camera.lookAt(scene.position)
    scene.add(camera) 
    
    console.log(userScene.root)   
    scene.add(userScene.root)

    const axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );

    const viewHelper = new ViewHelper(camera, renderer.domElement)
    viewHelper.controls = new EditorControls(camera, renderer.domElement)
    viewHelperRef.current.addEventListener( 'pointerup', ( event ) => {
			event.stopPropagation();
			viewHelper.handleClick( event );
		} );
    

    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    const cameraLight = new PointLight(0xffffff, 0.8)
    camera.add(cameraLight)

    const texture = new THREE.TextureLoader().load("gradient.png")
    texture.sourceFile = "gradient.png"
    texture.needsUpdate = true;
    
    scene.background = texture 

    transformControls.addEventListener( 'dragging-changed', function ( event ) {
      // orbitControls.enabled = !event.value;
      viewHelper.controls.enabled = !event.value
    } );
    
    // scene.add(orbitControls)
    scene.add(transformControls) 

    const clock = new THREE.Clock()
    
    scene.add(boxHelper) 
    renderer.setAnimationLoop(()=>{
      const delta = clock.getDelta();
      if ( viewHelper.animating === true ) {
        viewHelper.update( delta ); 
      }
      boxHelper.update()
      renderer.render(scene, camera)
      renderer.autoClear = false
      viewHelper.render( renderer )
      renderer.autoClear = true
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
  }, [camera, userScene.root])

  useEffect(()=>{
    const transformControls = transformControlsRef.current
    const tmp = userScene.root.getObjectById(Number(userScene.selected[0]))
    if(tmp !== undefined){
      // console.log(userScene.selected[0])
      transformControls.attach(tmp)
      boxHelper.setFromObject(tmp)
      boxHelper.visible = true
    }
    else{
      boxHelper.visible = false
      transformControls.detach ()
    }
  }, [ userScene.root, userScene.selected])

  let DownX = 0, DownY = 0, UpY = 0, UpX = 0
  const handlePointerDown = (event:React.MouseEvent) => {
    DownX = event.clientX
    DownY = event.clientY
  }
  const handlePointerUp = (event:React.MouseEvent) => {
    UpX = event.clientX
    UpY = event.clientY
    if(DownX === UpX && DownY === UpY){
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      pointer.x = ( event.clientX / webglOutput.current.offsetWidth ) * 2 - 1;
      pointer.y = - ( event.clientY / webglOutput.current.offsetHeight ) * 2 + 1;
      raycaster.setFromCamera( pointer, camera );
      const objects:any = [];
      userScene.root.traverseVisible((child) => {
        objects.push( child );
      })
      const intersects = raycaster.intersectObjects( objects, false );
      if(intersects.length === 0) userScene.setSelected([])
      for ( let i = 0; i < intersects.length; i ++ ) {
        userScene.setSelected([intersects[i].object.id.toString()])
      }    
    }
  }
  const handleViewHelperPointerUp = (event: React.MouseEvent) =>{
    event.stopPropagation();

  }
  const handleViewHelperPoinertDown = (event: React.MouseEvent) =>{
    event.stopPropagation();
  }
  return (
    <>
      <div 
        className='Viewport' 
        ref={webglOutput} 
        onPointerUp={handlePointerDown}
        onPointerDown={handlePointerUp}
        {...bindContextMenu(contextMenuState)}
      >
        
      </div>
      <div 
        ref={viewHelperRef}
        onPointerUp={handleViewHelperPointerUp}
        onPointerDown={handleViewHelperPoinertDown}
        className='ViewHelper'
      />
      <Menu 
        {...bindMenu(contextMenuState)}
      >
        <MenuItem onClick={contextMenuState.close}>Cake</MenuItem>
        <MenuItem onClick={contextMenuState.close}>Death</MenuItem>
      </Menu>
    </>
    
  )
}

