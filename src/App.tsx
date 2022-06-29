import React, { Component, createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import * as THREE from 'three'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import 'antd/dist/antd.css';
import axios from 'axios';
import { message } from 'antd';
axios.defaults.timeout = 300000
export const UserSceneContext = createContext<UserScene>({
  root: new THREE.Object3D(),
  selectedObject: undefined,
  selected: Array<string>(),
  scrollToObject: () => {},
  setSelected: () => {},
  focusToObject: () => {},
  url: '',
  setUrl: () => {},
})

const root = new THREE.Group()

export default function App() {
  
  const [selected, setSelected] = useState(Array<string>());
  const [url, setUrl] = useState('192.168.91.128:1080')
  let selectedObject = useRef<THREE.Object3D | undefined>(undefined)
  // const root = useRef(new THREE.Group())
  // const camera = useRef(new THREE.OrthographicCamera())
  
  const userScene: UserScene = {
    root : root,
    selectedObject: selectedObject.current,
    selected,
    scrollToObject: () => {},
    focusToObject: () => {},
    setSelected : function(value : string[]){
      if(!! selectedObject.current){
        selectedObject.current?.traverse((object)=>{
          if(object instanceof THREE.Mesh){
            object.material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide})
            object.material.color.set(0xffffff)
          }
        })
      } 
      selectedObject.current = this.root.getObjectByProperty('uuid', value[0])
      if(!! selectedObject.current){
        selectedObject.current.traverse((object)=>{
          if(object instanceof THREE.Mesh){
            object.material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide})
            object.material.color.set(0xff0000)
          }
        })
      } 
      this.selectedObject = selectedObject.current
      
      setSelected(value)
    },
    url,
    setUrl,
  }

  useEffect(()=>{
    root.name = 'Scene'
    setSelected([root.uuid])
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