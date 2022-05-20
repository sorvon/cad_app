import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import * as THREE from 'three'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

function App() {
  const userScene = new THREE.Object3D();
  const loader = new MMDLoader();
  loader.load("model/ayaka/神里绫华.pmx",
    (mmd) => {
      userScene.add(mmd)
    },
    undefined, undefined
  )
  // const loader = new OBJLoader();
  // loader.load("model/ayaka/神里绫华.obj",
  //   (mmd) => {
  //     userScene.add(mmd)
  //   },
  //   undefined, undefined
  // )
  return (
    <div className="App" >
      
      <Viewport userScene={userScene}/>
      <Sidebar/>
    </div>
  );
}

export default App;
