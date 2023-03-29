import { useCallback, useContext, useMemo, useState } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader' ;

import { UserSceneContext } from '../../../../App';
import * as THREE from 'three'
import { SettingFilled, CameraFilled } from '@ant-design/icons';
import { Button, Dropdown, Menu, Upload, message, notification, Progress, Modal, Input, Spin } from 'antd';
import type { UploadProps, MenuProps } from 'antd';
import * as tus from "tus-js-client";
import { batch8box, stp2stls, stl2stls } from '../../../backrequest';
import { ObjectLoader, OrthographicCamera, PerspectiveCamera } from 'three';
import { CombinedCamera } from '../../../Viewport/CombinedCamera';
import { camera } from '../../../Viewport';

type Props = {}

function MainMenu({}: Props) {
  const userScene = useContext(UserSceneContext)
  const [netConfig, setNetConfig] = useState(false)

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
        case 'stl':{
          groupConunt ++
          if ( reader.readAsBinaryString !== undefined ) {
            reader.readAsBinaryString( file );
          } else {
            reader.readAsArrayBuffer( file );
          }

          reader.onload = (event) => {
            if(!event.target?.result) return
            let geometry = new STLLoader().parse( event.target.result );
            const material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide});
            const mesh = new THREE.Mesh( geometry, material );
            mesh.name = file.name;
            group.add(mesh)
            updateScene()
          }
          break;
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
  
  const handleMenuClick : MenuProps['onClick'] = async info =>{
    switch (info.key) {
      case '2':{
        setNetConfig(true)
        break;
      }
      case '4':{
        stp2stls('debug', userScene)
        break;
      }
      case '5':{
        batch8box('debug', userScene, {x: 40, y: 40, z:10})
        break;
      }
      case '6':{
        /* upload */
        // const data = new Blob([JSON.stringify(userScene.root.getObjectByName('debug')?.toJSON())], {type:'application/json'})
        // console.log(userScene.root.getObjectByName('debug')?.toJSON())
        // let upload = new tus.Upload(data, {
        //   endpoint: '/data/upload/',
        //   retryDelays: [0, 3000, 5000, 10000, 20000],
        //   metadata: {
        //       filename: 'debug',
        //       filetype: data.type
        //   },
        //   onError: function(error) {
        //     return(error)
        //   },
        //   onProgress: function(bytesUploaded, bytesTotal) {

        //   },
        //   onSuccess: function() {
        //     console.log(upload.url)
        //   }
        // })
        // upload.start()

        /* load */
        const debugOld = userScene.root.getObjectByName('debug')
        if(!! debugOld) debugOld.removeFromParent()
        const loader = new THREE.ObjectLoader()
        loader.load('/data/debug.json', (obj)=>{
          console.log(obj)
          userScene.root.add(obj)
          userScene.setSelected([obj.uuid])
        });
        // const object = await loader.loadAsync('/data/debug.json')
        // console.log(object)
        // userScene.root.add(object)
        // userScene.setSelected([object.uuid])
        break;
      }
      default:{
        break;
      } 
    }
  }
  const handleCameraSelect : MenuProps['onSelect'] = info => {
    if (camera instanceof CombinedCamera){
      switch (info.key) {
        case '1':
          camera.toOrthographic()
          break
        case '2':
          camera.toPerspective()
          break
      }
    }
  }
  const mainMenu : MenuProps['items'] = [
    {
      label: (<Upload  {...importProps}>Import</Upload>),
      key: '1',
    },
    // {
    //   label: '网络配置',
    //   key: '2',
    // },
    {
      type: 'divider'
    },
    {
      label: 'debug',
      key: '3',
      children:[
        // {
        //   label: 'Upload Success',
        //   key: '4',
        // },
        // {
        //   label: 'Batch8box',
        //   key: '5',
        // },
        {
          label: 'load debug',
          key: '6',
        },
      ]
    },
  ]

  
  const cameraMenu : MenuProps['items'] = [
    {
      label: "正交相机",
      key: '1',
    },
    {
      label: "投影相机",
      key: '2',
    },
  ]
  
  const defaultCameraKey = () => {
    if(camera instanceof CombinedCamera)
    {
      if(camera.isOrthographicCamera) return ['1']
      else if(camera.isPerspectiveCamera) return ['2']
    }
    if(camera instanceof OrthographicCamera) return ['1']
    else if(camera instanceof PerspectiveCamera) return ['2']
    return ['1']
  }
  return (
    <div>
      <Dropdown 
        menu={{items: mainMenu, onClick: handleMenuClick, mode: 'vertical'}}
        // destroyPopupOnHide={true}
        arrow={true}
        trigger={['click']}>
        <Button type="ghost" shape="circle" icon={<SettingFilled style={{color:'aliceblue'}}/>} />
      </Dropdown>
      <Dropdown 
        menu={{items: cameraMenu, 
          onSelect: handleCameraSelect,
          defaultSelectedKeys: defaultCameraKey(),
          disabled: !(camera instanceof CombinedCamera),
          selectable: true}} 
        trigger={['click']}>
        <Button type="ghost" shape="circle" icon={<CameraFilled style={{color:'aliceblue'}}/>} />
      </Dropdown>
      <Modal 
        title='网络配置'
        open={netConfig} 
        onCancel={() => setNetConfig(false)}
      >
        <Input 
          addonBefore='url' 
          type={'url'}
          value={userScene.url}
          onChange={(e) => {userScene.setUrl(e.target.value)}}
        />
      </Modal>
    </div>
  )
}

export {MainMenu}

