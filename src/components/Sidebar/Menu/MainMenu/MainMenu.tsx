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
    if(!files) return
    const group = new THREE.Group();
    group.name = 'group' + group.id
    for (let i = 0; i < files.length; i++) {
      const filename = files[i].name
		  const extension = filename.split( '.' ).pop()!.toLowerCase();
      const reader = new FileReader();
      
      switch (extension) {
        case 'stl':{
          if ( reader.readAsBinaryString !== undefined ) {
            reader.readAsBinaryString( files[i] );
          } else {
            reader.readAsArrayBuffer( files[i] );
          }

          reader.onload = (event) => {
            if(!event.target?.result) return
            let geometry = new STLLoader().parse( event.target.result );
            const material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide});
            const mesh = new THREE.Mesh( geometry, material );
            mesh.name = filename;
            group.add(mesh)
            // userScene.setSelected([mesh.uuid])
          }
          break;
        }
        case 'obj':{
          reader.readAsText(files[i])

          reader.onload = (event) => {
            if(typeof event.target?.result === 'string'){
              let obj = new OBJLoader().parse( event.target.result);
              obj.name = filename;
              group.add(obj)
              // userScene.setSelected([obj.uuid])
            }
          }
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
    setTimeout(()=>{
      userScene.root.add(group)
      userScene.setSelected([group.uuid])
    }, 500)
    
    
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