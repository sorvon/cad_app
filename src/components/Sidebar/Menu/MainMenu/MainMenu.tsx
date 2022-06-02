import React, { ChangeEventHandler, useContext, useRef } from 'react'
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { IconButton, styled } from '@mui/material';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader' ;
import { UserSceneContext } from '../../../../App';
import * as THREE from 'three'

type Props = {}
const Input = styled('input')({
  display: 'none',
});

function MainMenu({}: Props) {
  const userScene = useContext(UserSceneContext)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.files)
    const files = event.target.files
    
    for (let i = 0; i < files.length; i++) {
      const filename = files[i].name
		  const extension = filename.split( '.' ).pop().toLowerCase();
      const reader = new FileReader();
      reader.readAsText(files[i])
      switch (extension) {
        case 'stl':{
          reader.onload = (event) => {
            let geometry = new STLLoader().parse( event.target.result );
            const material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide});
            const mesh = new THREE.Mesh( geometry, material );
            mesh.name = filename;
            userScene.root.add(mesh)
            userScene.setSelected(mesh.id.toString())
          }
          break;
        }
        case 'obj':{
          reader.onload = (event) => {
            if(typeof event.target.result === 'string'){
              let obj = new OBJLoader().parse( event.target.result);
              obj.name = filename;
              userScene.root.add(obj)
              userScene.setSelected(obj.id.toString())
            }
          }
          console.log("obj")
          break;
        }
        // case 'pmx':{
        //   reader.onload = (event) => {
        //     let obj = new MMDLoader().;
        //     obj.name = filename;
        //     userScene.root.add(obj)
        //   }
        //   break;
        // }
        default:
          break;
      }
    }
    console.log(event.target.files)
    setAnchorEl(null);
  }
  return (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <SettingsApplicationsIcon/>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <label>
          <Input onChange={handleImport} accept="*" multiple type="file" />
          <MenuItem>Import</MenuItem>
        </label>
        <MenuItem onClick={handleClose}>test</MenuItem>
      </Menu>
    </div>
  )
}

export {MainMenu}