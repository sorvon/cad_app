import { Empty } from 'antd';
import { useContext, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { AmbientLight, PointLight } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { UserSceneContext } from '../../../App';
import './DetailView.css'
import {DXFLoader} from '../../Loaders'
type Props = {
  detailObject: THREE.Object3D | undefined
}
const camera = new THREE.OrthographicCamera()
export function DetailView(props: Props) {
  const webglOutput = useRef<HTMLDivElement | null>(null)


  const init = async () => {
    if(!props.detailObject) return
    const loader = new DXFLoader()
    const detailObjectSlt = props.detailObject
    const parent = detailObjectSlt?.parent
    const grandparent = parent?.parent 
    if(! grandparent) return
    const path = '/data/group/' + grandparent.name + '/' + parent.name + '/' + detailObjectSlt.name.slice(0, -4) + '.dxf'
    // const path = '/data/group/83579eefadcaaf99d16749d76cc7673d/0001/1.deltaY(0.01).dxf'
    console.log(path) 
    const detailObject = await loader.load(path)
    if(!detailObject) return
    const renderer = new THREE.WebGLRenderer()
    const scene = new THREE.Scene()
    const orbitControls = new OrbitControls(camera, renderer.domElement)

    if(webglOutput.current === null){
      return
    }
    
    while(webglOutput.current.firstChild !== null){
      webglOutput.current.removeChild(webglOutput.current.firstChild)
    }
    webglOutput.current.appendChild(renderer.domElement)
    renderer.setSize(webglOutput.current.offsetWidth, webglOutput.current.offsetHeight)
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight
    camera.left = webglOutput.current.offsetWidth / -2
    camera.right = webglOutput.current.offsetWidth / 2
    camera.top = webglOutput.current.offsetHeight / 2
    camera.bottom = webglOutput.current.offsetHeight / -2
    camera.near = 0.1
    camera.far = 20000
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, 400)
    scene.add(camera) 

    scene.add(detailObject)

    const axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );   

    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    const cameraLight = new PointLight(0xffffff, 0.8)
    camera.add(cameraLight)

    const texture = new THREE.TextureLoader().load("gradient.png")
    texture.sourceFile = "gradient.png"
    texture.needsUpdate = true;
    
    scene.background = texture 
    
    renderer.setAnimationLoop(()=>{
      renderer.render(scene, camera)
    })

    focusToObject(detailObject, camera, orbitControls)
    orbitControls.update()

    window.addEventListener( 'resize', ()=>{
      if(webglOutput.current === null){
        return
      }
      // camera.aspect = webglOutput.current.offsetWidth / webglOutput.current.offsetHeight;
      camera.left = webglOutput.current.offsetWidth / -2
      camera.right = webglOutput.current.offsetWidth / 2
      camera.top = webglOutput.current.offsetHeight / 2
      camera.bottom = webglOutput.current.offsetHeight / -2
      camera.updateProjectionMatrix();
      renderer.setSize( webglOutput.current.offsetHeight , webglOutput.current.offsetHeight );
      // renderer.setSize( webglOutput.current.clientWidth , webglOutput.current.clientWidth );
      console.log(webglOutput.current.clientWidth, webglOutput.current.clientHeight)
      console.log(webglOutput.current.offsetHeight, webglOutput.current.offsetHeight)
    } );
  }
  useEffect(()=>{
    init()
  }, [])
    
  const focusToObject=(target: THREE.Object3D, camera: THREE.Camera, controls: OrbitControls) => {

    let distance;
    let delta = new THREE.Vector3();
    let box = new THREE.Box3();
    let center = new THREE.Vector3()
    let sphere = new THREE.Sphere();
    box.setFromObject( target );

    if ( box.isEmpty() === false ) {

      box.getCenter( center );
      distance = box.getBoundingSphere( sphere ).radius;

    } else {

      // Focusing on an Group, AmbientLight, etc

      center.setFromMatrixPosition( target.matrixWorld );
      distance = 0.1;

    }
    controls.target = center
    delta.set( 0, 0, 1 );
    delta.applyQuaternion( camera.quaternion );
    delta.multiplyScalar( distance * 2 );
    if(camera instanceof THREE.PerspectiveCamera){
      camera.position.copy( center ).add( delta );
    }
    else if(camera instanceof THREE.OrthographicCamera){
      const maxlength = Math.max(webglOutput.current!.offsetHeight, webglOutput.current!.offsetWidth)
      camera.zoom = (maxlength / distance) / 4
      camera.updateProjectionMatrix()
    }
  }
  return (
    <div className='DetailView' ref={webglOutput}>
      {!props.detailObject? <Empty imageStyle={{height:'auto', marginTop:'10vh'}}/> : undefined}
    </div>
  )
}
