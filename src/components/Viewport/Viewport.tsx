import React, { RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three'
import { AmbientLight, PointLight } from 'three'
import { ViewHelper } from './ViewHelper';
import './Viewport.css'
import { UserSceneContext } from '../../App';
import { DetailView } from './DetailView';
import { Dropdown, Menu, Modal, Input} from 'antd';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';

type Props = {}

export function Viewport({}: Props) {
  const userScene = useContext(UserSceneContext)
  const [modalSetting, setModalSetting] = useState(false)
  const [modalDetail, setModalDetail] = useState(false)
  
  
  const webglOutput : RefObject<HTMLDivElement> = useRef(null)
  const viewHelperRef : RefObject<HTMLDivElement> = useRef(null)
  // const rendererRef = useRef(new THREE.WebGLRenderer())
  // const cameraRef = useRef(new THREE.PerspectiveCamera())
  const camera = userScene.camera
  // const sceneRef = useRef(new THREE.Scene())
  const transformControlsRef = useRef<TransformControls|null>(null)
  const orbitControlsRef = useRef<OrbitControls|null>(null)
  const boxHelperRef = useRef(new THREE.BoxHelper( new THREE.Mesh( new THREE.SphereGeometry(), new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ) ));
  const boxHelper = boxHelperRef.current

  
  useEffect(()=>{
    const renderer = new THREE.WebGLRenderer({powerPreference:'high-performance'})
    
    const scene = new THREE.Scene()
    transformControlsRef.current = new TransformControls(camera, renderer.domElement)
    const transformControls = transformControlsRef.current
    
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
      camera.left = webglOutput.current.offsetWidth / -8
      camera.right = webglOutput.current.offsetWidth / 8
      camera.top = webglOutput.current.offsetHeight / 8
      camera.bottom = webglOutput.current.offsetHeight / -8
    }
    camera.near = 0.1
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
    orbitControlsRef.current = new OrbitControls(camera, renderer.domElement)
    const orbitControls = orbitControlsRef.current
    viewHelper.controls = orbitControls
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
      orbitControls.enabled = !event.value;
      viewHelper.controls.enabled = !event.value
    } );
    
    // scene.add(orbitControls)
    scene.add(transformControls) 

    const clock = new THREE.Clock()
    const FPS = 60
    const frametime = 1 / FPS
    let delta = 0;
    scene.add(boxHelper) 
    renderer.setAnimationLoop(()=>{
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
        camera.left = webglOutput.current.offsetWidth / -8
        camera.right = webglOutput.current.offsetWidth / 8
        camera.top = webglOutput.current.offsetHeight / 8
        camera.bottom = webglOutput.current.offsetHeight / -8
      }
      camera.updateProjectionMatrix();
      renderer.setSize( webglOutput.current.offsetWidth , webglOutput.current.offsetHeight );
      console.log(webglOutput.current.clientWidth, webglOutput.current.clientHeight)
    } );
  }, [userScene.root])

  useEffect(()=>{
    const transformControls = transformControlsRef.current
    const tmp = userScene.selectedObject
    if(tmp !== undefined){
      // console.log(userScene.selected[0])
      transformControls?.attach(tmp)
      boxHelper.setFromObject(tmp)
      boxHelper.visible = true
    }
    else{
      boxHelper.visible = false
      transformControls?.detach ()
    }
  }, [boxHelper, userScene.root, userScene.selectedObject])


  let DownX = 0, DownY = 0, UpY = 0, UpX = 0
  const isMovedRef = useRef(true)
  const handlePointerDown = (event:React.PointerEvent) => {
    DownX = event.clientX
    DownY = event.clientY
  }
  const handlePointerUp = (event:React.PointerEvent) => {
    console.log('up')
    UpX = event.clientX
    UpY = event.clientY
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
    if(isMovedRef.current){
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
  userScene.focusToObject = useCallback((target: THREE.Object3D) => {
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
    orbitControlsRef.current!.target = center
    delta.set( 0, 0, 1 );
    delta.applyQuaternion( camera.quaternion );
    delta.multiplyScalar( distance * 4 );
    camera.position.copy( center ).add( delta );
  }, [])
  const menu = (
    <Menu
      onClick={handleMenu}
      items={[
        {
          label: '参数配置',
          key: '1',
        },
        {
          label: '填充详情',
          key: '2',
        },
      ]}
    />
  );
  return (
    <div onContextMenuCapture={handleContextMenu} >
      <Dropdown overlay={menu}  trigger={['contextMenu']}>
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
        visible={modalSetting}
        onCancel={() => setModalSetting(false)}
        onOk={() => setModalSetting(false)}
      >
        <Input addonBefore='激光功率'/>
      </Modal>
      <Modal 
        centered 
        footer={null} 
        visible={modalDetail} 
        onCancel={() => setModalDetail(false)}
        width='80vw'
        destroyOnClose
        bodyStyle={{height:'80vh', width:'80vw'}}
      >
        <DetailView detailObject={userScene.selectedObject}/>
      </Modal>
    </div>
    
  )
}

