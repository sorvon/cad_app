import React, { Component, createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import * as THREE from 'three'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export const UserSceneContext = createContext<UserScene>({
  root: new THREE.Object3D(),
  selected: Array<string>(),
  setSelected: () => {}
})
export default function App() {
  const [selected, setSelected] = useState(Array<string>());
  const root = useRef(new THREE.Object3D())
  
  const userScene: UserScene = {
    root : root.current,
    selected,
    setSelected
  }
  
  useEffect(()=>{
    root.current.name = 'Scene'
    
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

  return (
    <div className="App" >
      <UserSceneContext.Provider value={userScene}>
        <Viewport />
        <Sidebar />
      </UserSceneContext.Provider>
    </div>
  )
}