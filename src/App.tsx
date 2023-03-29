import React, { Component, createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import { ProcessPanel } from "./components/ProcessPanel";
import * as THREE from 'three'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import axios from 'axios';
import { ConfigProvider, Layout, theme } from 'antd';
import { useLocalStorage } from 'usehooks-ts'
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
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
  groupType : 1,
  setGroupType : () => {}
})

const root = new THREE.Group()

export default function App() {
  
  const [selected, setSelected] = useState(Array<string>())
  const [url, setUrl] = useState('192.168.91.128:1080')
  const [groupType, setGroupType] = useLocalStorage<number>("groupType", 1)
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
            object.material.color.set('#d9d9d9')
          }
        })
      } 
      selectedObject.current = this.root.getObjectByProperty('uuid', value[0])
      if(!! selectedObject.current){
        selectedObject.current.traverse((object)=>{
          if(object instanceof THREE.Mesh){
            object.material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide})
            object.material.color.set('#13c2c2')
          }
        })
      } 
      this.selectedObject = selectedObject.current
      
      setSelected(value)
    },
    url,
    setUrl,
    groupType,
    setGroupType
  }

  useEffect(()=>{
    root.name = 'Scene'
    setSelected([root.uuid])
  }, [userScene.root])
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
  }
  const handleKeyDown = (event : React.KeyboardEvent) =>{
    const parent = userScene.selectedObject?.parent
    if(! parent || ! userScene.selectedObject) return
    switch (event.key) {
      case 'Delete':{
        let index = parent.children.indexOf(userScene.selectedObject)
        parent.remove(userScene.selectedObject)
        if(parent.children.length === 0) {
          userScene.setSelected([])
          return
        }
        userScene.setSelected([parent.children[index].uuid])
        userScene.scrollToObject(parent.children[index])
        break;
      }
      default:
        break;
    }
  }
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const siderStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '50px',
    color: '#fff',
    background: colorBgContainer,
  };
  
  return (
    <div className="App" onContextMenuCapture={handleContextMenu} onKeyDown={handleKeyDown}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          "components": {
            "Tree": {
              "colorBgContainer": "transparent",
              "controlItemBgActive": "rgba(0, 0, 0, 0.45)",
              "colorText": "aliceblue"
            }
          },
          token: {
            borderRadius: 2,
          },
        }}
      >
      <UserSceneContext.Provider value={userScene}>
        <Layout>
          <Content>
            <Viewport />
            <Sidebar />
          </Content>
          <Sider width={300} style={siderStyle}>
            <ProcessPanel/>
          </Sider>
        </Layout>
      </UserSceneContext.Provider>
      </ConfigProvider>
    </div>
  )
}