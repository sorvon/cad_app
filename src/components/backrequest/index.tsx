import { message, Modal, notification, Progress, Spin } from "antd";
import axios, { AxiosError } from "axios";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

export const stp2stls = (tusid : string, userScene: UserScene) => {
  const ws = new WebSocket('ws://localhost:8000/stp/stp2stps?tusid=' + tusid)
  notification.info({
    key:tusid,
    message: (<><Spin/> 数据处理中</>),
    description: (<Progress percent={0} />),
    duration: null,
  })
  ws.onclose = ((event)=>{
    const ws2 = new WebSocket('ws://localhost:8000/stp/stp2stl?tusid=' + tusid)
    notification.info({
      key:tusid,
      message: (<><Spin/> 数据处理中</>),
      description: (<Progress percent={50} />),
      duration: null,
    })
    ws2.onmessage = (async (event) => {
      const group = await loadRemoteModel(tusid, JSON.parse(event.data))
      notification.success({
        key:tusid,
        message: (<>数据处理完成</>),
        description: (<Progress percent={100} />),
      })
      setTimeout(()=>{
        userScene.root.add(group)
        userScene.setSelected([group.uuid])
        userScene.focusToObject(group)
      }, 500)
    })
    ws2.onclose = (event)=>{
      console.log(event)
    }
    console.log(event)
  })
  ws.onerror = (event => {
    console.log(event)
  })
}
// export const stp2stps = (tusid : string) => {
//   const ws = new WebSocket('/stp/stp2stps?tusid=' + tusid)
//   ws.onclose = ((event)=>{
//     stp2stl(tusid)
//     console.log(event)
//   })
// }
// export const stp2stl = (tusid : string) => {
//   const ws = new WebSocket('/stp/stp2stl?tusid=' + tusid)
//   ws.onmessage = ((event) => {
//     loadRemoteModel(tusid, event.data)
//   })
//   ws.onclose = ((event)=>{
//     console.log(event)
//   })
// }
const loadRemoteModel = async (tusid:string, filelist : string[]) => {
  const group = new THREE.Group()
  group.name = tusid
  console.log(filelist)
  for(const filename of filelist){
    const extension = filename.split('.').pop()!.toLowerCase();
    const response = await axios.get('/data/stl/' + tusid + '/' + filename);
    switch (extension) {
      case 'stl': {
        let geometry = new STLLoader().parse(response.data);
        const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = filename;
        group.add(mesh);
        break;
      }
      case 'obj': {
        let obj = new OBJLoader().parse(response.data);
        obj.name = filename;
        group.add(obj);
        break;
      }
      default: {
        break;
      }
    }
  }

  return group
}

export const batch8box = (tusid : string, userScene: UserScene, args: Object) => {
  const ws = new WebSocket(`ws://localhost:8000/stp/batch8box?tusid=${tusid}&args=${JSON.stringify(args)}`)
  const parent = userScene.root.getObjectByName(tusid)
  if(!parent) return
  notification.info({
    key: tusid,
    message: (<><Spin/>  计算中</>),
    duration: null,
  });
  ws.onmessage = async (event)=>{
    const batched = JSON.parse(event.data)
    if(batched === 'batch8box') return
    for(const key of Object.keys(batched)){
      const group = new THREE.Group()
      group.name = key
      parent?.add(group)
      for(const value of batched[key]){
        let obj = parent.getObjectByName(value)
        if(! obj){
          obj = await loadRemoteModel(tusid, [value])
          obj = obj.children[0]
          console.log(obj)
        }
        else{
          obj.removeFromParent()
        }
        group.add(obj)
      }
    }
    parent.children.filter((item)=>(item.children.length===0 && item instanceof THREE.Group))
    .forEach(item => {item.removeFromParent()})
    userScene.setSelected([parent])
  }
  ws.onclose = () => {
    notification.success({
      key: tusid,
      message: (<>计算完成</>),
    });
  }
}

export const fill8box = (tusid : string, userScene: UserScene, args: Object) => {
  const parent = userScene.root.getObjectByName(tusid)
  let batched = {}
  parent?.children.forEach((value_group: THREE.Object3D) => {
    const arr: string[] = []
    value_group.children.forEach((value : THREE.Object3D) => {
      arr.push(value.name)
    })
    batched = {...batched, [value_group.name]: arr}
  })
  const ws = new WebSocket(`ws://localhost:8000/stp/fill8lines?tusid=${tusid}&args=${JSON.stringify(args)}`)
  ws.onopen = (event) => {
    ws.send(JSON.stringify(batched))
  }
  notification.info({
    key:tusid,
    message: (<><Spin/> 填充计算</>),
    description: (<Progress percent={0} />),
    duration: null,
    onClose: ()=> {ws.close()},
  })
  ws.onmessage = (event)=>{
    console.log(event.data)
    notification.info({
      key:tusid,
      message: (<><Spin/> 填充计算</>),
      description: (<Progress percent={Number(event.data)} />),
      duration: null,
      onClose: ()=> {ws.close()},
    })
  }
  ws.onclose = (event) => {
    console.log(event)
    notification.success({
      key:tusid,
      message: (<>填充计算</>),
      description: (<Progress percent={100} />),
      onClose: ()=> {ws.close()},
    })
  }
  
  ws.onerror = (event) => {
    console.log(event)
    notification.error({
      key:tusid,
      message: (<>填充计算</>),
      description: ("出错"),
      onClose: ()=> {ws.close()},
    })
    ws.onclose = null
  }
}

export const downloadDXF = (tusid: string) => {
  const ws = new WebSocket('ws://localhost:8000/stp/downloadDXF?tusid=' + tusid)
  notification.info({
    key:tusid,
    message: (<><Spin/> 打包中</>),
    duration: null,
  })
  ws.onmessage = (event) => {
    notification.success({
      key:tusid,
      message: (<><Spin/> 完成</>),
      duration: 1,
    })
    const path = event.data
    Modal.info({
      title: "处理完成",
      content: (<a href={path} download={getFormattedTime()+'.zip'}>点击下载</a>),
    })
  }
}
function getFormattedTime() {
  var today = new Date();
  var y = today.getFullYear();
  // JavaScript months are 0-based.
  var m = today.getMonth() + 1;
  var d = today.getDate();
  var h = today.getHours();
  var mi = today.getMinutes();
  var s = today.getSeconds();
  return y +"-" + m +"-" + d +"-" + h +"-" + mi +"-" + s;
}