import React, { Component, createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import * as THREE from 'three'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import 'antd/dist/antd.css';
export const UserSceneContext = createContext<UserScene>({
  root: new THREE.Object3D(),
  camera: new THREE.PerspectiveCamera(),
  selectedObject: undefined,
  selected: Array<string>(),
  scrollToObject: () => {},
  setSelected: () => {},
  focusToObject: () => {},
  url: '',
  setUrl: () => {},
})
export default function App() {
  
  const [selected, setSelected] = useState(Array<string>());
  const [url, setUrl] = useState('192.168.91.128:1080')
  let selectedObject = useRef<THREE.Object3D | undefined>(undefined)
  const root = useRef(new THREE.Group())
  const camera = useRef(new THREE.OrthographicCamera())
  
  const userScene: UserScene = {
    root : root.current,
    camera : camera.current,
    selectedObject: selectedObject.current,
    selected,
    scrollToObject: () => {},
    focusToObject: () => {},
    setSelected : function(value : string[]){
      setSelected(value)
      selectedObject.current = this.root.getObjectByProperty('uuid', value[0])
      this.selectedObject = selectedObject.current
    },
    url,
    setUrl,
  }

  useEffect(()=>{
    root.current.name = 'Scene'
    setSelected([root.current.uuid])
    // const mmdLoader = new MMDLoader();
    // mmdLoader.load("model/ayaka/神里绫华.pmx",
    //   (mmd) => {
    //     mmd.name='神里绫华.pmx'
    //     userScene.root.add(mmd)
    //     userScene.setSelected(mmd.id.toString())
    //   }, 
    //   undefined, undefined
    // )
    
  }, [userScene.root])
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
  }
  return (
    <div className="App" onContextMenuCapture={handleContextMenu} >
      <UserSceneContext.Provider value={userScene}>
        <Viewport />
        <Sidebar />
      </UserSceneContext.Provider>
    </div>
  )
}