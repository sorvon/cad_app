import React, { useCallback, useContext, useRef, useState } from 'react'
import { UserSceneContext } from '../../../App';
import { MoveObjectCommand } from '../../../command';
import './Hierarchy.css'
import { Dropdown, Menu, message, notification, Spin, Tree } from 'antd';
import type { DirectoryTreeProps } from 'antd/lib/tree';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';
import {batch8box, downloadDXF, fill8box} from '../../backrequest'
import * as THREE from 'three';
export function Hierarchy() {
  const userScene = useContext(UserSceneContext)
  const [expanded, setExpanded] = useState([userScene.root.uuid])
  const hierarchyRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<any>(null);
  const [menuVisible, setMenuVisible] = useState(false)
  const tusidRef = useRef('')

  userScene.scrollToObject = useCallback((object:THREE.Object3D)=>{
    let parent = object.parent
    const newExpanded: string[] = []
    while(parent !== userScene.root){
      if(!parent) return
      if(expanded.indexOf(parent.uuid) === -1){
        newExpanded.push(parent.uuid)
      }
      parent = parent.parent
    }
    if(newExpanded.length !== 0){
      setExpanded([...expanded, ...newExpanded])
    }
    setTimeout(()=>{
      treeRef.current.scrollTo({key: object.uuid, align:'top', offset:100})
    }, 500)
  }, [expanded, userScene.root])

  const handleDragEnter: DirectoryTreeProps['onDragEnter'] = info => {
    // expandedKeys 需要受控时设置
    setExpanded(info.expandedKeys as string[])
  };
  const handleDragStart: DirectoryTreeProps['onDragStart'] = ({event, node}) =>{
    const obj = node as unknown as THREE.Object3D
    setExpanded(expanded.filter((value)=>{
      return value !== obj.uuid
    }))
  }
  const handleDrop:DirectoryTreeProps['onDrop'] = (info) =>{
    const moveObject = ( object:any, newParent:any, nextObject:any ) => {
      if ( nextObject === null ) nextObject = undefined;
      let newParentIsChild = false;
      object.traverse( function ( child: any ) {
        if ( child === newParent ) newParentIsChild = true;
      } );
      if ( newParentIsChild ) return;
      const cmd = new MoveObjectCommand(null, object, newParent, nextObject )
      cmd.execute()
    }
    
    const objectSrc = userScene.root.getObjectByProperty('uuid', (info.dragNode as unknown as THREE.Object3D).uuid)  
    const objectDst = userScene.root.getObjectByProperty('uuid', (info.node as unknown as THREE.Object3D).uuid) 
    if(!objectSrc || !objectDst) return
    if(info.dropToGap){
      if(userScene.root.uuid === objectDst.uuid) return
      if(info.dropPosition < 0){
        moveObject(objectSrc, objectDst.parent, objectDst)
      }
      else if(info.dropPosition > 0){
        const parent = objectDst.parent
        if(!parent) return
        moveObject(objectSrc, parent, parent.children[info.dropPosition])
      }
    }
    else{
      moveObject(objectSrc, objectDst, objectDst.children[0])
    }
    userScene.setSelected([(info.dragNode as unknown as THREE.Object3D).uuid])
  }
  const handleExpanded: DirectoryTreeProps['onExpand']= (keys, info) => {
    console.log(keys)
    setExpanded(keys as string[])
  }  

  const handleSelect :DirectoryTreeProps['onSelect']= (keys, info) => {
    if(keys.length !== 0){
      userScene.setSelected(keys.filter(item => item!== userScene.root.uuid))
    }
    // userScene.setSelected(keys)
  }

  const handleKeyDown = (event : React.KeyboardEvent) =>{
    const parent = userScene.selectedObject!.parent
    if(! parent || ! userScene.selectedObject) return
    switch (event.key) {
      case 'ArrowUp':{
        let index = parent.children.indexOf(userScene.selectedObject) - 1
        if(index < 0) index = parent.children.length - 1
        userScene.setSelected([parent.children[index].uuid])
        userScene.scrollToObject(parent.children[index])
        break;
      }
      case 'ArrowDown':{
        let index = parent.children.indexOf(userScene.selectedObject) + 1
        if(index === parent.children.length) index = 0
        userScene.setSelected([parent.children[index].uuid])
        userScene.scrollToObject(parent.children[index])
        break;
      }
      default:
        break;
    }
  }
  const handleRightClick:DirectoryTreeProps['onRightClick'] = (event) => {
    const obj = event.node as unknown as THREE.Object3D
    setMenuVisible(true)
    tusidRef.current = obj.name
    console.log(obj.name.length)
  }
  const handleMenuClick : MenuClickEventHandler  = async (info) => {
    setMenuVisible(false)
    switch (info.key) {
      case '1':{
        if(tusidRef.current.length !== 32 && tusidRef.current !== 'debug') return
        batch8box(tusidRef.current, userScene) 
        break;
      }
      case '2':{
        if(tusidRef.current.length !== 32 && tusidRef.current !== 'debug') return
        const children = userScene.root.getObjectByName(tusidRef.current)?.children
        if(!children) break
        for (let i = 0; i < children.length; i++) {
          if(!(children[i] instanceof THREE.Group)){
            message.warn("请先分组")
            return
          }          
        }
        fill8box(tusidRef.current)
        break;
      }
      case '3':{
        downloadDXF(tusidRef.current)
        break;
      }
      default:{
        break;
      } 
    }
    
  }
  const menu = (
    <Menu
      onClick={handleMenuClick}
      items={[
        {
          label: '分组',
          key: '1',
        },
        {
          label: '填充',
          key: '2',
        },
        {
          label: '下载',
          key: '3',
        },
      ]}
    />
  );
  return (
    <div ref={hierarchyRef} className='Hierarchy' tabIndex={0} onKeyDown={handleKeyDown}> 
      <Dropdown 
        overlay={menu} 
        trigger={['contextMenu']} 
        visible={menuVisible} 
        onVisibleChange={(visible)=>{setMenuVisible(visible)}}
      >
        <Tree 
          ref={treeRef}
          rootStyle={{background:'transparent'}}
          style={{background:'transparent'}}
          draggable={{icon:false}}
          
          // multiple
          blockNode
          expandedKeys={expanded}
          onExpand={handleExpanded}
          height={hierarchyRef.current?.offsetHeight}
          fieldNames={{title:'name', key:'uuid', children:'children'}}
          treeData={[userScene.root as any]} 
          selectedKeys={userScene.selected}  
          onSelect={handleSelect}   
          onDragEnter={handleDragEnter}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onRightClick={handleRightClick}
        />
      </Dropdown>
    </div> 
  )
}
