import React, { useCallback, useContext } from 'react'
import './Sidebar.css'
import { UserSceneContext } from '../../App';
import { Hierarchy } from './Hierarchy/Hierarchy';
import { MainMenu } from './Menu/';


type Props = {}

export function Sidebar({}: Props) {
  const userScene = useContext(UserSceneContext)

  const handleClick = (event:React.MouseEvent) => {
    event.stopPropagation()
  } 
  const handleDoubleClick = useCallback(() => {
    userScene.focusToObject(userScene.selectedObject)
  },[userScene])
  return (
  <div className='Sidebar' onClick={handleClick} onDoubleClick={handleDoubleClick}>
    <div className="MainMenu" >
      <MainMenu />
    </div>
    <div className='RootTree' >
      <Hierarchy/> 
    </div>
  </div>
  )
}