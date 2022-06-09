import { useContext } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader' ;
import { UserSceneContext } from '../../../../App';
import * as THREE from 'three'
import { SettingFilled } from '@ant-design/icons';
import { Button, Dropdown, Menu, Upload, message } from 'antd';
import type { UploadProps } from 'antd';

type Props = {}

function MainMenu({}: Props) {
  const userScene = useContext(UserSceneContext)

  let groupConunt = 0
  let group = new THREE.Group()
  group.name = 'group' + group.id
  const importProps: UploadProps = {
    name: 'file',
    // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    // headers: {
    //   authorization: 'authorization-text',
    // },
    multiple: true,
    beforeUpload(file, fileList) {
      const extension = file.name.split( '.' ).pop()!.toLowerCase();
      console.log(extension)
      const reader = new FileReader()
      switch (extension) {
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
            }
          }
          break;
        }
        default:{
          break;
        }
      }
      if(groupConunt === fileList.length){
        setTimeout(()=>{
          userScene.root.add(group)
          userScene.setSelected([group.uuid])
        }, 500)
        // groupConunt = 0
        // group = new THREE.Group()
        // group.name = 'group' + group.id
      }
      return Upload.LIST_IGNORE
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };
  const menu = (
    <Menu
      // onClick={handleClose}
      items={[
        {
          label: (<Upload  {...importProps}>Import</Upload>),
          key: '1',
          
        },
        {
          label: 'test',
          key: '2',
        },
        {
          label: 'test2',
          key: '3',
          disabled: true,
          children:[{
            label: '4rd menu item',
            key: '4',
          }]
        },
      ]}
    />
  );
  return (
    <div>
      <Dropdown overlay={menu} trigger={['click']}>
          <Button type="ghost" shape="circle" icon={<SettingFilled />} />
      </Dropdown>
    </div>
  )
}

export {MainMenu}

