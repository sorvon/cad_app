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
  selectedObject: undefined,
  selected: Array<string>(),
  scrollToObject: ()=>{},
  setSelected: () => {}
})
export default function App() {
  const [selected, setSelected] = useState(Array<string>());
  let selectedObject = useRef<THREE.Object3D | undefined>(undefined)
  const root = useRef(new THREE.Group())
  
  const userScene: UserScene = {
    root : root.current,
    selectedObject: selectedObject.current,
    selected,
    scrollToObject: ()=>{},
    setSelected : function(value : string[]){
      setSelected(value)
      selectedObject.current = this.root.getObjectByProperty('uuid', value[0])
      this.selectedObject = selectedObject.current
    }
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