import React, { RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { AmbientLight, Mesh, PointLight } from 'three'
import { ViewHelper } from './ViewHelper';
import {InfiniteGridHelper} from "./InfiniteGridHelper";
import { CombinedCamera } from "./CombinedCamera";
import './Viewport.css'
import { UserSceneContext } from '../../App';
import { DetailView } from './DetailView';
import { Dropdown, Modal, Input, MenuProps} from 'antd';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';

type Props = {}
export const camera: THREE.OrthographicCamera|THREE.PerspectiveCamera | CombinedCamera
              = new CombinedCamera(1920, 1080, 50, 0.01, 20000, 0.01, 20000)
              // = new THREE.PerspectiveCamera()
const renderer = new THREE.WebGLRenderer({powerPreference:'high-performance'})
const scene = new THREE.Scene()
const transformControls = new TransformControls(camera, renderer.domElement)
const orbitControls = new OrbitControls(camera, renderer.domElement)
const boxHelper = new THREE.BoxHelper( new THREE.Mesh( new THREE.SphereGeometry(), new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ) )
const obbBox = new THREE.LineSegments(undefined, new THREE.LineDashedMaterial( { color: 0xffaa00, dashSize: 3, gapSize: 1 } ) );
export function Viewport({}: Props) {
  const userScene = useContext(UserSceneContext)
  const [modalSetting, setModalSetting] = useState(false)
  const [modalDetail, setModalDetail] = useState(false)

  const webglOutput : RefObject<HTMLDivElement> = useRef(null)
  const viewHelperRef : RefObject<HTMLDivElement> = useRef(null)
  
  // init viewport
  useEffect(()=>{       
    if(webglOutput.current === null || viewHelperRef.current === null){
      return
    }
    while(webglOutput.current.firstChild !== null){
      webglOutput.current.removeChild(webglOutput.current.firstChild)
    }

    webglOutput.current.appendChild(renderer.domElement)
    renderer.setSize(webglOutput.current.offsetWidth, webglOutput.current.offsetHeight)
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    if(camera instanceof THREE.PerspectiveCamera){
      camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight
    }
    else if(camera instanceof THREE.OrthographicCamera){
      camera.left = webglOutput.current.offsetWidth / -2
      camera.right = webglOutput.current.offsetWidth / 2
      camera.top = webglOutput.current.offsetHeight / 2
      camera.bottom = webglOutput.current.offsetHeight / -2
    }
    else if(camera instanceof CombinedCamera){
      camera.setSize(webglOutput.current.offsetWidth, webglOutput.current.offsetHeight)
      camera.toOrthographic()
    }
    
    camera.name = "Main Camera"
    camera.near = 0.01
    camera.far = 20000
    camera.updateProjectionMatrix();

    camera.position.set( 200, 200, 400 );
    camera.lookAt(scene.position)
    scene.add(camera) 
    
    console.log(userScene.root)   
    scene.add(userScene.root)

    const axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );

    const viewHelper = new ViewHelper(camera, renderer.domElement)
    viewHelper.controls = orbitControls
    viewHelperRef.current.addEventListener( 'pointerup', ( event ) => {
			event.stopPropagation();
			viewHelper.handleClick( event );
		} );

    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    const cameraLight = new PointLight(0xffffff, 0.8)
    camera.add(cameraLight)

    const  infiniteGridHelper = new InfiniteGridHelper(20, 200, new THREE.Color(255, 255, 255), 8000)
    scene.add( infiniteGridHelper );
    const texture = new THREE.TextureLoader().load("gradient.png")
    texture.sourceFile = "gradient.png"
    texture.needsUpdate = true;
    
    // scene.background = texture 
    scene.background = new THREE.Color(71/255, 71/255, 71/255)

    transformControls.addEventListener( 'dragging-changed',( event ) => {
      orbitControls.enabled = !event.value;
      viewHelper.controls.enabled = !event.value
    } );
    
    // scene.add(transformControls) 

    const clock = new THREE.Clock()
    const FPS = 60
    const frametime = 1 / FPS
    let delta = 0;
    scene.add(boxHelper) 
    scene.add(obbBox)
    renderer.setAnimationLoop(()=>{
      orbitControls.update()
      delta += clock.getDelta();
      if(delta > frametime){
        if ( viewHelper.animating === true ) {
          viewHelper.update( delta ); 
        }

        boxHelper.update()
        renderer.render(scene, camera)
        renderer.autoClear = false
        viewHelper.render( renderer )
        renderer.autoClear = true
        delta = delta % frametime
      }
    })

    window.addEventListener( 'resize', ()=>{
      if(webglOutput.current === null){
        return
      }
      if(camera instanceof THREE.PerspectiveCamera){
        camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight;
      }
      else if(camera instanceof THREE.OrthographicCamera){
        camera.left = webglOutput.current.offsetWidth / -2
        camera.right = webglOutput.current.offsetWidth / 2
        camera.top = webglOutput.current.offsetHeight / 2
        camera.bottom = webglOutput.current.offsetHeight / -2
      }
      else if(camera instanceof CombinedCamera){
        camera.setSize(webglOutput.current.offsetWidth, webglOutput.current.offsetHeight)
      }
      camera.updateProjectionMatrix();
      renderer.setSize( webglOutput.current.offsetWidth , webglOutput.current.offsetHeight );
    } );
  }, [userScene.root])

  // attach selected by boxHelper
  useEffect(()=>{
    const obj = userScene.selectedObject
    
    if(obj !== undefined){
      console.log(obj.userData)
      transformControls.attach(obj)
      if(userScene.groupType === 2 && obj.userData.length === 8) {
        obbBox.visible = true;
        boxHelper.visible = false
        const geometry = new THREE.BufferGeometry();
				const position = [];
        position.push(
          obj.userData[0]["x"], obj.userData[0]["y"], obj.userData[0]["z"],
          obj.userData[1]["x"], obj.userData[1]["y"], obj.userData[1]["z"],

          obj.userData[1]["x"], obj.userData[1]["y"], obj.userData[1]["z"], 
          obj.userData[2]["x"], obj.userData[2]["y"], obj.userData[2]["z"],

          obj.userData[2]["x"], obj.userData[2]["y"], obj.userData[2]["z"], 
          obj.userData[3]["x"], obj.userData[3]["y"], obj.userData[3]["z"],

          obj.userData[3]["x"], obj.userData[3]["y"], obj.userData[3]["z"], 
          obj.userData[0]["x"], obj.userData[0]["y"], obj.userData[0]["z"],

          obj.userData[4]["x"], obj.userData[4]["y"], obj.userData[4]["z"], 
          obj.userData[5]["x"], obj.userData[5]["y"], obj.userData[5]["z"],

          obj.userData[5]["x"], obj.userData[5]["y"], obj.userData[5]["z"], 
          obj.userData[6]["x"], obj.userData[6]["y"], obj.userData[6]["z"],

          obj.userData[6]["x"], obj.userData[6]["y"], obj.userData[6]["z"], 
          obj.userData[7]["x"], obj.userData[7]["y"], obj.userData[7]["z"],

          obj.userData[7]["x"], obj.userData[7]["y"], obj.userData[7]["z"], 
          obj.userData[4]["x"], obj.userData[4]["y"], obj.userData[4]["z"],

          obj.userData[0]["x"], obj.userData[0]["y"], obj.userData[0]["z"], 
          obj.userData[5]["x"], obj.userData[5]["y"], obj.userData[5]["z"],

          obj.userData[1]["x"], obj.userData[1]["y"], obj.userData[1]["z"], 
          obj.userData[6]["x"], obj.userData[6]["y"], obj.userData[6]["z"],

          obj.userData[2]["x"], obj.userData[2]["y"], obj.userData[2]["z"], 
          obj.userData[7]["x"], obj.userData[7]["y"], obj.userData[7]["z"],

          obj.userData[3]["x"], obj.userData[3]["y"], obj.userData[3]["z"], 
          obj.userData[4]["x"], obj.userData[4]["y"], obj.userData[4]["z"],
        )
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
        obbBox.geometry = geometry;
      }
      else{
        boxHelper.setFromObject(obj)
        boxHelper.visible = true
        obbBox.visible = false
      }
    }
    
    else{
      boxHelper.visible = false
      obbBox.visible = false
      transformControls?.detach ()
    }
  }, [userScene.groupType, userScene.root, userScene.selectedObject])


  let DownX = 0, DownY = 0, UpY = 0, UpX = 0
  const isMovedRef = useRef(true)
  const handlePointerDown = (event:React.PointerEvent) => {
    DownX = event.clientX
    DownY = event.clientY
    event.stopPropagation()
  }
  const handlePointerUp = (event:React.PointerEvent) => {
    UpX = event.clientX
    UpY = event.clientY
    event.stopPropagation()
    isMovedRef.current = DownX !== UpX || DownY !== UpY
    if(!isMovedRef.current){
      if(webglOutput.current === null) return
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
        console.log([intersects[i].object.id.toString()])
        userScene.setSelected([intersects[i].object.uuid])
        userScene.scrollToObject(intersects[i].object)
      }  
    }
  }
  const handleContextMenu = (event: React.MouseEvent) => {
    if(userScene.selectedObject === undefined || isMovedRef.current){
      event.stopPropagation()
    }
  }
  const handleMenu : MenuClickEventHandler = info =>{
    switch (info.key) {
      case '1':{
        setModalSetting(true)
        break;
      }
      case '2':{
        setModalDetail(true)
        break;
      }
      default:{
        break;
      } 
    }
  }
  const handleDoubleClick = useCallback(() => {
    userScene.focusToObject(userScene.selectedObject)
  },[userScene])
  // focusToObject
  userScene.focusToObject = useCallback((target: THREE.Object3D) => {
    if(!target) return
    console.log(target)
    let distance;
    let delta = new THREE.Vector3();
    let box = new THREE.Box3();
    let center = new THREE.Vector3()
    let sphere = new THREE.Sphere();
    box.setFromObject( target );

    if ( box.isEmpty() === false ) {
      box.getCenter( center );
      distance = box.getBoundingSphere( sphere ).radius;
    } else {
      // Focusing on an Group, AmbientLight, etc
      center.setFromMatrixPosition( target.matrixWorld );
      distance = 0.1;
    }
    orbitControls.target = center
    delta.set( 0, 0, 1 );
    delta.applyQuaternion( camera.quaternion );
    delta.multiplyScalar( distance * 4 );
    if(camera instanceof THREE.PerspectiveCamera){
      camera.position.copy( center ).add( delta );
    }
    else if(camera instanceof THREE.OrthographicCamera){
      const maxlength = Math.max(webglOutput.current!.offsetHeight, webglOutput.current!.offsetWidth)
      camera.zoom = (maxlength / distance) / 4
      camera.updateProjectionMatrix()
    }
    
  }, [])
  const menu : MenuProps['items'] = [
    {
      label: '填充详情',
      key: '2',
      // disabled : userScene.selectedObject === undefined,
    },
  ]
  return (
    <div onContextMenuCapture={handleContextMenu} >
      <Dropdown menu={{items: menu, onClick: handleMenu}}  trigger={['contextMenu']}>
        <div 
          className='Viewport' 
          ref={webglOutput} 
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          onDoubleClick={handleDoubleClick}
          
        />
      </Dropdown>
      
      <div 
        ref={viewHelperRef}
        onPointerUp={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        className='ViewHelper'
      />
      
      <Modal
        title='参数配置'
        open={modalSetting}
        onCancel={() => setModalSetting(false)}
        onOk={() => setModalSetting(false)}
      >
        <Input addonBefore='激光功率'/>
      </Modal>
      <Modal  
        centered 
        footer={null} 
        open={modalDetail} 
        onCancel={() => setModalDetail(false)}
        onOk={() => setModalDetail(false)}
        width='80vw'
        destroyOnClose
        bodyStyle={{height:'100vh', width:'100vw'}}
      >
        <DetailView detailObject={userScene.selectedObject} />
      </Modal>
    </div>
    
  )
}

