import React, { useEffect, useContext, useRef, useState } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader' ;
import { UserSceneContext } from '../../App';
import { MoveObjectCommand } from '../../command';
import * as tus from "tus-js-client";
import { Space,Card, Button, UploadProps, Upload, Progress, Input, InputNumber, Menu, MenuProps, message, Modal, notification, Radio, Select, Spin, Tree } from 'antd';
import { SettingFilled, CameraFilled } from '@ant-design/icons';
import { red, volcano, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta } from '@ant-design/colors';
import {batch8box, downloadDXF, fill8lines, stp2stls, stl2stls} from '../backrequest'
import * as THREE from 'three';
import { DirectoryTreeProps } from 'antd/es/tree';
import { useLocalStorage } from 'usehooks-ts'
import './ProcessPanel.css'
type Props = {}

export function ProcessPanel({}: Props) {
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
  let groupConunt = 0
  let group = new THREE.Group()
  group.name = 'group' + group.id
  const importProps: UploadProps = {
    name: 'file',
    action: '/data/upload/',
    // action: 'http://localhost:8000/data/upload/',
    // headers: {
    //   authorization: 'authorization-text',
    //   "Access-Control-Allow-Origin": "*",
    // }, 
    accept : '.stl,.obj,.stp,.step,.json',
    // multiple: true,
    maxCount: 1, 
    showUploadList: false,
    beforeUpload(file, fileList) {
      userScene.root.children.forEach((value) => {
        value.removeFromParent()
      })
      const updateScene = ()=>{
        if(group.children.length === 1){
          if(group.children[0] instanceof THREE.Group){
            group = group.children[0]
          }
        } 
        userScene.root.add(group)
        userScene.setSelected([group.uuid])
      }
      const extension = file.name.split( '.' ).pop()!.toLowerCase();
      
      console.log(extension)
      const reader = new FileReader()
      switch (extension) {
        case 'stp': case 'step': case 'stl':{
          return true
        }
        case 'obj':{
          groupConunt ++
          reader.readAsText(file)
          reader.onload = (event) => {
            if(typeof event.target?.result === 'string'){
              let obj = new OBJLoader().parse( event.target.result);
              obj.name = file.name;
              group.add(obj)
              updateScene()
            }
          }
          break;
        }
        case 'json':{
          groupConunt ++
          reader.readAsText(file)
          reader.onload = (event) => {
            if(typeof event.target?.result === 'string'){
              const loader = new THREE.ObjectLoader()
              loader.parse(JSON.parse(event.target.result), (obj) =>{
                console.log(obj)
                group.add(obj)
                updateScene()
              })
            }
          }
          break;
        }
        
        default:{
          break;
        }
      }
      return Upload.LIST_IGNORE
    },
    customRequest(options) {
      if(! (options.file instanceof File)) return
      console.log(options.file)
      let file = options.file
      console.log(file.name)
      const extension = file.name.split( '.' ).pop()!.toLowerCase();
      let upload = new tus.Upload(file, {
        endpoint: options.action,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
            filename: file.name,
            filetype: file.type
        },
        onError: function(error) {
          options.onError && options.onError(error)
          notification.error({
            key:'upload',
            message: '失败',
            description: (<Progress percent={100} status='exception' />),
          });
          console.log(error)
          return(error)
        },
        onProgress: function(bytesUploaded, bytesTotal) {
          const percent = ~~(bytesUploaded / bytesTotal * 100)
          options.onProgress && options.onProgress({percent})
          notification.info({
            key:'upload',
            message: '上传中',
            description: (<Progress percent={percent} />),
          });
        },
        onSuccess: function() {
          options.onSuccess && options.onSuccess(upload)
          notification.success({
            key:'upload',
            message: '上传完成',
            description: (<Progress percent={100} />),
          });
          const tusid = upload.url?.split('/').pop()
          console.log('tusid', tusid)
          if(!tusid) return
          if(extension === 'stl') stl2stls(tusid, userScene)
          else stp2stls(tusid, userScene)
          console.log(upload)
        }
      })
      
      upload.start()
      console.log(options)
    },
  };
  const handleChildrenShade = () => {
    const children = userScene.root.getObjectByName(tusidRef.current)?.children
    if(!children) return
    children.forEach((child, index)=>{
      child.traverse((obj) => {
        if(obj instanceof THREE.Mesh){
          obj.material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide})
          obj.material.color.set(colorList[index%colorList.length][9 - index % 8])              
        }
      })
    })
  }
  const handleExportJson = () => {
    const export_obj = userScene.root.getObjectByName(tusidRef.current)
    const data =  new Blob([JSON.stringify(export_obj?.toJSON())], {type:'application/json'})
    Modal.info({
      title: "导出json",
      content: (<a href={URL.createObjectURL(data)} download={tusidRef.current+'.json'}>点击下载</a>),
    })
  }
  useEffect(()=>{
    tusidRef.current = userScene.root.children[0]?.name;
  })
  return (
    <div className='ProcessPanel'>
      <div style={{textAlign:"center"}}>
        <Radio.Group style={{textAlign:"center"}} onChange={(value)=>userScene.setGroupType(value.target.value)} value={userScene.groupType}>
          <Radio value={1}>三轴</Radio>
          <Radio value={2}>五轴</Radio>
        </Radio.Group>
      </div>
      
      <InputNumber 
        addonBefore='拆分倾角  :' 
        addonAfter=' ° '
        value={userScene.importTaper}
        disabled={userScene.groupType===1}
        onChange={(value) => {userScene.setImportTaper(value)}}
      />
      <div style={{textAlign:"center"}}>
        <Upload {...importProps}>
            <Button type="primary">导入STL文件</Button>
        </Upload>
      </div>
      

      <Card  title="分组" size='small'>
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
          addonBefore='倾角' 
          addonAfter='°'
          value={userScene.groupTaper}
          disabled={userScene.groupType===1}
          onChange={(value) => {userScene.setGroupTaper(value)}}
        />
        <p/>
        <p style={{textAlign:"center"}}>
          <Button onClick={()=>{batch8box(tusidRef.current, userScene, {x: groupX, y: groupY, z:groupZ, taper:userScene.groupTaper, type:userScene.groupType})}} type="primary">分组</Button>
        </p>
      </Card>

      <Card title="填充" size='small'>
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
        <p/>
        <p style={{textAlign:"center"}}>
          <Button type="primary" onClick={()=>{fill8lines(tusidRef.current, userScene, {fillType, fillInterval, offsetX, offsetY, offsetZ, type:userScene.groupType})}}>填充</Button>
        </p>
      </Card>
      <Card style={{"textAlign":'center'}}>
        <Space  wrap>
          <Button type="primary" onClick={()=>{downloadDXF(tusidRef.current, userScene)}}>下载</Button>
          <Button type="primary" onClick={handleChildrenShade}>染色</Button>
          <Button type="primary" onClick={handleExportJson}>导出json</Button>
        </Space>
      </Card>
    </div>
  )
}
