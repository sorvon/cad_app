import React, { useCallback, useContext, useRef, useState } from 'react'
import { UserSceneContext } from '../../../App';
import { MoveObjectCommand } from '../../../command';
import './Hierarchy.css'
import { Dropdown, Input, InputNumber, Menu, MenuProps, message, Modal, notification, Radio, Select, Spin, Tree } from 'antd';
import { red, volcano, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta } from '@ant-design/colors';
import {batch8box, downloadDXF, fill8lines} from '../../backrequest'
import * as THREE from 'three';
import { DirectoryTreeProps } from 'antd/es/tree';
import { useLocalStorage } from 'usehooks-ts'

export function Hierarchy() {
  const userScene = useContext(UserSceneContext)
  const [expanded, setExpanded] = useState([userScene.root.uuid])
  const hierarchyRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<any>(null);
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuDisable, setMenuDisable] = useState(false)
  const [groupConfig, setGroupConfig] = useState(false)
  const [groupX, setGroupX] = useLocalStorage<number | null>("groupX", 40)
  const [groupY, setGroupY] = useLocalStorage<number | null>("groupY", 40)
  const [groupZ, setGroupZ] = useLocalStorage<number | null>("groupZ", 10)
  const [fillConfig, setFillConfig] = useState(false)
  const [fillInterval, setFillInterval] = useLocalStorage<string | number | null>("fillInterval", 0.01)
  const [fillType, setFillType] = useLocalStorage("fillType", "line")
  const [offsetX, setOffsetX] = useLocalStorage<number | null>("offsetX", 0)
  const [offsetY, setOffsetY] = useLocalStorage<number | null>("offsetX", 0)
  const [offsetZ, setOffsetZ] = useLocalStorage<number | null>("offsetX", 0)
  const [colorList, setColorList] = useState([red, volcano, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta ])
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
    setExpanded(keys as string[])
  }  

  const handleSelect :DirectoryTreeProps['onSelect']= (keys, info) => {
    if(keys.length !== 0){
      userScene.setSelected(keys.filter(item => item!== userScene.root.uuid))
      console.log(userScene.selectedObject)
    }
    // userScene.setSelected(keys)
  }

  const handleKeyDown = (event : React.KeyboardEvent) =>{
    const parent = userScene.selectedObject?.parent
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
    if(obj.uuid === userScene.root.uuid || obj.children.length <= 0
      ||(obj.name.length !== 32 && obj.name !== 'debug')){
      setMenuDisable(true)
      return
    }
    // if(obj.name.length === 4){
    //   if(!isNaN(parseInt(obj.name[0])) && !isNaN(parseInt(obj.name[1]))
    //     &&!isNaN(parseInt(obj.name[2])) && !isNaN(parseInt(obj.name[3]))){
    //       setMenuDisable(true)
    //       return
    //   }
    // }

    setMenuDisable(false)
    tusidRef.current = obj.name
    // console.log(obj.name.length)
  }
  const handleMenuClick : MenuProps['onClick']  = async (info) => {
    setMenuVisible(false)
    switch (info.key) {
      case 'batch':{
        if(tusidRef.current.length !== 32 && tusidRef.current !== 'debug') return
        setGroupConfig(true)
        // batch8box(tusidRef.current, userScene) 
        break;
      }
      case 'fill':{
        if(tusidRef.current.length !== 32 && tusidRef.current !== 'debug') return
        const children = userScene.root.getObjectByName(tusidRef.current)?.children
        if(!children) break
        for (let i = 0; i < children.length; i++) {
          if(!(children[i] instanceof THREE.Group)){
            message.warning("请先分组")
            return
          }          
        }
        setFillConfig(true)
        // fill8box(tusidRef.current)
        break;
      }
      case 'download':{
        downloadDXF(tusidRef.current, userScene)
        break;
      }
      case 'export json':{
        const export_obj = userScene.root.getObjectByName(tusidRef.current)
        // console.log( new Blob([JSON.stringify(export_obj?.toJSON())], {type:'application/json'}))
        const data =  new Blob([JSON.stringify(export_obj?.toJSON())], {type:'application/json'})
        Modal.info({
          title: "导出json",
          content: (<a href={URL.createObjectURL(data)} download={tusidRef.current+'.json'}>点击下载</a>),
        })
        break;
      }
      case 'children shade':{
        const children = userScene.root.getObjectByName(tusidRef.current)?.children
        if(!children) break
        children.forEach((child, index)=>{
          child.traverse((obj) => {
            if(obj instanceof THREE.Mesh){
              obj.material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide})
              obj.material.color.set(colorList[index%colorList.length][9 - index % 8])              
            }
          })
        })
        break;
      }
      default:{
        break;
      } 
    }
    
  }
  const menu : MenuProps['items'] = [
  {
    label: '导出json',
    key : 'export json',
    disabled : menuDisable,
  },
  {
    label: '分组',
    key: 'batch',
    disabled : menuDisable,
  },
  {
    label: '填充',
    key: 'fill',
    disabled : menuDisable,
  },
  {
    label: '下载',
    key: 'download',
    disabled : menuDisable,
  },
  {
    label: '子节点着色',
    key: 'children shade',
  }
]
  return (
    <div ref={hierarchyRef} className='Hierarchy' tabIndex={0} onKeyDown={handleKeyDown}> 
      <Dropdown 
        menu={{items: menu, onClick: handleMenuClick}} 
        trigger={['contextMenu']} 
        open={menuVisible} 
        onOpenChange={(visible)=>{setMenuVisible(visible)}}
      >
        <Tree 
          ref={treeRef}
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
      <Modal 
        title='分组参数'
        open={groupConfig} 
        onCancel={() => setGroupConfig(false)}
        onOk={() => {
          batch8box(tusidRef.current, userScene, {x: groupX, y: groupY, z:groupZ, taper:userScene.groupTaper, type:userScene.groupType})
          setGroupConfig(false)
        }}
      >
        <br/>
        <InputNumber 
          addonBefore='扫场X' 
          addonAfter='mm'
          value={groupX}
          onChange={(value) => {setGroupX(value)}}
        />
        <InputNumber 
          addonBefore='扫场Y' 
          addonAfter='mm'
          value={groupY}
          onChange={(value) => {setGroupY(value)}}
        />
        <InputNumber 
          addonBefore='扫场Z' 
          addonAfter='mm'
          value={groupZ}
          onChange={(value) => {setGroupZ(value)}}
        />
        <InputNumber 
          addonBefore='倾角  :' 
          addonAfter=' ° '
          value={userScene.groupTaper}
          disabled={userScene.groupType===1}
          onChange={(value) => {userScene.setGroupTaper(value)}}
        />
        <Radio.Group onChange={(value)=>userScene.setGroupType(value.target.value)} value={userScene.groupType}>
          <Radio value={1}>三轴</Radio>
          <Radio value={2}>五轴</Radio>
        </Radio.Group>
      </Modal>
      <Modal 
        title='填充参数'
        open={fillConfig} 
        onCancel={() => setFillConfig(false)}
        onOk={() => {
          fill8lines(tusidRef.current, userScene, {fillType, fillInterval, offsetX, offsetY, offsetZ, type:userScene.groupType})
          setFillConfig(false)
        }}
      >
        <Select value={fillType} onChange={setFillType} style={{ width: 120 }}
          options ={[
            {
              value: 'line',
              label: '直线'
            },
            {
              value: 'arc',
              label: '圆弧'
            },
            // {
            //   value: 'helical',
            //   label: '螺旋线'
            // }
          ]}
        />
        <br /> <br />
        <InputNumber 
          addonBefore='填充间隔' 
          addonAfter='mm'
          value={fillInterval}
          onChange={(value) => {setFillInterval(value)}}
        />
        <InputNumber 
          addonBefore='Offset X' 
          addonAfter='mm'
          value={offsetX}
          onChange={(value) => {setOffsetX(value)}}
        />
        <InputNumber 
          addonBefore='Offset Y' 
          addonAfter='mm'
          value={offsetY}
          onChange={(value) => {setOffsetY(value)}}
        />
        <InputNumber 
          addonBefore='Offset Z' 
          addonAfter='mm'
          value={offsetZ}
          onChange={(value) => {setOffsetZ(value)}}
        />
        <Radio.Group onChange={(value)=>userScene.setGroupType(value.target.value)} value={userScene.groupType} disabled={true}>
          <Radio value={1}>三轴</Radio>
          <Radio value={2}>五轴</Radio>
        </Radio.Group>
      </Modal>
      
    </div> 
  )
}
