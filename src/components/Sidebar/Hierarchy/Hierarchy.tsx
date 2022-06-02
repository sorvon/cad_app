import React, { SyntheticEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Button, IconButton, styled, Typography} from '@mui/material';
import { TreeView ,TreeViewProps } from '@mui/lab';
import TreeItem, {
  TreeItemProps,
  useTreeItem,
  TreeItemContentProps,
} from '@mui/lab/TreeItem';
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { UserSceneContext } from '../../../App';
import { HTML5Backend } from 'react-dnd-html5-backend';
import clsx from 'clsx';
import { MoveObjectCommand } from '../../../command';
import './Hierarchy.css'

const CustomContent = React.forwardRef(function CustomContent(
  props: TreeItemContentProps,
  ref,
) {
  const {
    classes,
    className,
    label,
    nodeId,
    icon: iconProp,
    expansionIcon,
    displayIcon,
  } = props;

  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection,
  } = useTreeItem(nodeId);
  
  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    preventSelection(event);
  };

  const handleExpansionClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    handleExpansion(event);
  };

  const handleSelectionClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    handleSelection(event);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled,
      })}
      onMouseDown={handleMouseDown}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div onClick={handleExpansionClick} className={classes.iconContainer}>
        {icon}
      </div>
      <Typography
        onClick={handleSelectionClick}
        component="div"
        className={classes.label}
      >
        {label}
      </Typography>
    </div>
  );
});

type Props = TreeItemContentProps & {
  children?: any
}

const DraggableItem = (props: Props) => {
  const userScene = useContext(UserSceneContext)
  const itemRef = useRef<HTMLDivElement>(null)
  const [{isDragging}, drag] = useDrag(() => ({
    type: "userScene",
    item: {id: Number(props.nodeId)},
    canDrag: () => (props.nodeId !== userScene.root.id.toString()),
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }))
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "userScene",
    canDrop: () => {return true},
    hover: (item: any, monitor) => {
      if (!monitor.isOver({shallow:true})) {
        return
      }
      const itemBoundingRect = itemRef.current!.getBoundingClientRect()
      const y = monitor.getClientOffset()!.y
      const isRoot = userScene.root.id.toString() === props.nodeId
      if(y - itemBoundingRect.top <= 5 && !isRoot){
        itemRef.current!.className = 'drag top'
      }
      else if (itemBoundingRect.bottom - y  <= 5 && !isRoot) {
        itemRef.current!.className = 'drag bottom'
      }
      else{
        itemRef.current!.className = 'drag middle'
      }
    },
    drop: (item: any, monitor) => {
      if(monitor.didDrop()) return
      const object = userScene.root.getObjectById(item.id)
      const itemBoundingRect = itemRef.current!.getBoundingClientRect()
      const y = monitor.getClientOffset()!.y
      const isRoot = userScene.root.id.toString() === props.nodeId
      if(y - itemBoundingRect.top <= 5 && !isRoot){
        const nextObject = userScene.root.getObjectById(Number(props.nodeId))
        moveObject( object, nextObject?.parent, nextObject )
      }
      else if (itemBoundingRect.bottom - y  <= 5 && !isRoot) {
        let nextObject;
        
        const beforeObject = userScene.root.getObjectById(Number(props.nodeId))
        if(beforeObject === undefined) return
        const parent = beforeObject?.parent;
        const nextIndex = parent!.children.indexOf(beforeObject) + 1
				if ( nextIndex !== parent!.children.length ) {
					nextObject = parent!.children[nextIndex]
				} else {
					nextObject = undefined;			
				}
				moveObject( object, parent, nextObject );
      }
      else{
        const newParent = userScene.root.getObjectById(Number(props.nodeId))
        moveObject(object, newParent, undefined)
      }
      
      itemRef.current!.className = 'drag'
      userScene.setSelected([props.nodeId])
    },
    collect: monitor => ({
      isOver: monitor.isOver({shallow:true}),
    }),
  }), )

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
  useEffect(()=>{
    if(userScene.selected[0] === props.nodeId){
      let {top, right, bottom, left} =itemRef.current.getBoundingClientRect()
      let w = window.innerWidth
      let h = window.innerHeight
      if(bottom <= h && top >= 0 && left >= 0 && right <= w) return
      itemRef.current.scrollIntoView({behavior: "auto", block: "center", inline: "nearest"})
    }
  }, [props.nodeId, userScene.selected])
  return (
    <div 
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        ref={drop}
        style={{
          background: isOver ? 'skyblue' : 'transparent',
        }}
      >
        <div 
          ref={itemRef} 
          className='drag'
          onDragLeave={() => {itemRef.current!.className = 'drag'}}
        >
          <TreeItem  ContentComponent={CustomContent} nodeId={props.nodeId} label={props.label}>
            {props.children}
          </TreeItem>
        </div>
        
      </div>
    </div>
  )
}

export function Hierarchy() {
  const userScene = useContext(UserSceneContext)
  const [expanded, setExpanded] = useState([userScene.root.id.toString()])
  
  const renderTree = (object: THREE.Object3D, depth = 0) => {
    return(
      <DraggableItem classes={{
        root: '',
        expanded: '',
        selected: '',
        focused: '',
        disabled: '',
        iconContainer: '',
        label: ''
      }} key={object.uuid} nodeId={object.id.toString()} label={object.name} >
        {Array.isArray(object.children)
        ? object.children.map((object) => renderTree(object, depth + 1))
        : null}
      </DraggableItem>
    )
  }
  const handleExpanded = (event: SyntheticEvent<Element, Event>, nodeIds: string[]) => {
    setExpanded(nodeIds)
  }
  const handleTreeViewSelect = (event:SyntheticEvent<Element, Event>, value: Array<string>) =>{
    userScene.setSelected(value)
    // console.log("props:", userScene.root)
    console.log("value:", value)
    event.stopPropagation()
  }
  useEffect(()=>{   
    let tmpObj = userScene.root.getObjectById(Number(userScene.selected[0]))?.parent
    if(!tmpObj) return
    console.log(tmpObj === userScene.root )
    const newExpanded: string[] = []
    while(tmpObj !== userScene.root){
      const tmpId = tmpObj.id.toString()
      if(expanded.indexOf(tmpId) === -1){
        console.log(tmpId)
        newExpanded.push(tmpId)
      }
      tmpObj = tmpObj.parent
      if(!tmpObj) return
    }
    if(newExpanded.length !== 0){
      console.log([...expanded])
      setExpanded(preExpended => [...preExpended, ...newExpanded])
    }
  }, [userScene.root, userScene.selected])

  return (
    <div className='Hierarchy'>
      <DndProvider backend={HTML5Backend}>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          multiSelect={true}
          onFocusCapture={e => e.stopPropagation()} 
          onNodeSelect={handleTreeViewSelect}
          expanded={expanded}
          onNodeToggle={handleExpanded}
          selected={userScene.selected}
        >
          {renderTree(userScene.root)}
        </TreeView>
      </DndProvider>
    </div>
  )
}
