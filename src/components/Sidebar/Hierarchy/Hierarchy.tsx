import { useCallback, useContext, useRef, useState } from 'react'
import { UserSceneContext } from '../../../App';
import { MoveObjectCommand } from '../../../command';
import './Hierarchy.css'
import { Tree } from 'antd';
import type { DirectoryTreeProps } from 'antd/lib/tree';

export function Hierarchy() {
  const userScene = useContext(UserSceneContext)
  const [expanded, setExpanded] = useState([userScene.root.uuid])
  const hierarchyRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<any>(null);

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
      userScene.setSelected(keys)
    }
  }

  

  return (
    <div ref={hierarchyRef} className='Hierarchy'> 
      <Tree 
        ref={treeRef}
        rootStyle={{background:'transparent'}}
        style={{background:'transparent'}}
        draggable={{icon:false}}
        selectedKeys={userScene.selected}
        // multiple
        blockNode
        expandedKeys={expanded}
        onExpand={handleExpanded}
        height={hierarchyRef.current?.offsetHeight}
        fieldNames={{title:'name', key:'uuid', children:'children'}}
        treeData={[userScene.root as any]}   
        onSelect={handleSelect}   
        onDragEnter={handleDragEnter}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    </div> 
  )
}
