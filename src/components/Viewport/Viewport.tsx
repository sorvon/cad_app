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
import { Menu, MenuItem, Popper, ClickAwayListener, Paper, MenuList, PopperProps, Dialog, Button, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import {
  usePopupState,
  bindContextMenu,
  bindPopover,
  bindPopper,
  anchorRef,
  bindTrigger,
  bindDialog,
} from 'material-ui-popup-state/hooks'
import { DetailView } from './DetailView';

type Props = {}

export function Viewport({}: Props) {
  const userScene = useContext(UserSceneContext)
  const [anchorEl, setAnchorEl] = React.useState<PopperProps['anchorEl']>(null);
  const popupStateContextMenu = usePopupState({ variant: 'popper', popupId: 'demoMenu'})
  const popupStateSetting = usePopupState({ variant: 'dialog', popupId: 'settingDialog' })
  const popupStateDetail = usePopupState({ variant: 'dialog', popupId: 'detailDialog' })
  
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
  const handlePointerDown = (event:React.PointerEvent) => {
    DownX = event.clientX
    DownY = event.clientY
  }
  const handlePointerUp = (event:React.PointerEvent) => {
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
      if(event.button === 2){
        popupStateContextMenu.anchorEl.getBoundingClientRect = () => (new DOMRect(UpX, UpY, 0, 0))
        popupStateContextMenu.open()
      }
    }
    
  }
  const handleViewHelperPointerUp = (event: React.MouseEvent) =>{
    event.stopPropagation();

  }
  const handleViewHelperPoinertDown = (event: React.MouseEvent) =>{
    event.stopPropagation();
  }
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
  }
  const menuSetting = () => {
    popupStateContextMenu.close()
  }
  const menuDetail = () => {
    popupStateContextMenu.close()
  }
  return (
    <div 
      onContextMenu={handleContextMenu}
    >
      <div 
        className='Viewport' 
        ref={webglOutput} 
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDown}
        // {...bindContextMenu(popupState)}
      >
        
      </div>
      <div 
        ref={viewHelperRef}
        onPointerUp={handleViewHelperPointerUp}
        onPointerDown={handleViewHelperPoinertDown}
        className='ViewHelper'
      />
      <Popper 
        {...bindPopper(popupStateContextMenu)}
        placement="bottom-start"
      >
        <Paper>
          <ClickAwayListener mouseEvent='onPointerUp' onClickAway={popupStateContextMenu.close}>
            <MenuList>
              <MenuItem {...bindTrigger(popupStateSetting)}>参数配置</MenuItem>
              <MenuItem {...bindTrigger(popupStateDetail)}>填充详情</MenuItem>
            </MenuList>
            
          </ClickAwayListener>
        </Paper>
      </Popper>

      <Dialog {...bindDialog(popupStateSetting)}>
        <DialogTitle>参数配置</DialogTitle>
        <DialogContent>
          <DialogContentText>
            参数配置（全局）
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button >Cancel</Button>
          <Button>Subscribe</Button>
        </DialogActions>
      </Dialog>
      <Dialog fullScreen className='DetailViewDialog' {...bindDialog(popupStateDetail)}>
        <DetailView detailObject={userScene.root.getObjectById(Number(userScene.selected[0]))}></DetailView>
      </Dialog>
      <div ref={anchorRef(popupStateContextMenu)}/>
    </div>
    
  )
}

