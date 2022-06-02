import React, { Component, createRef, RefObject, useContext } from 'react'
import './Sidebar.css'
import {Button, IconButton, styled} from '@mui/material';
import { UserSceneContext } from '../../App';
import { Hierarchy } from './Hierarchy/Hierarchy';
import { MainMenu } from './Menu/';




type Props = {}
const Input = styled('input')({
  display: 'none',
});

export function Sidebar({}: Props) {
  const userScene = useContext(UserSceneContext)

  const handleClick = (event:React.MouseEvent) => {
    event.stopPropagation()
  }
  return (
  <div className='Sidebar' onClick={handleClick}>
    <div className="MainMenu" >
      <MainMenu />
    </div>
    <div className='RootTree' >
      <Hierarchy/> 
    </div>
  </div>
  )
}