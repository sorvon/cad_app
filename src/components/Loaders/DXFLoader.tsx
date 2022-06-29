import axios from "axios"
import * as THREE from "three"

class DXFLoader{
  load = async (path:string) => {
    const file = await axios.get(path)

    let data = file.data.split(/\r\n|\n/) as string[]
    
    data = data.slice(data.indexOf('ENTITIES')+1, data.indexOf('ENDSEC')-1)

    if(data.length % 14 !== 0 ) {
      console.log('dxf error: 不是14的整数倍') 
      return
    }
    const vertices = []
    const indices = []
    for(let i = 0, j = 0; i < data.length; i+=14, j+=2){
      vertices.push( Number(data[i+3]), Number(data[i+5]), Number(data[i+7]) );
      vertices.push( Number(data[i+9]), Number(data[i+11]), Number(data[i+13]) );
      indices.push(j, j+1)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(indices)
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometry.computeBoundingSphere()
    const material = new THREE.MeshBasicMaterial( { color: 0x0000ff} )
    let object = new THREE.LineSegments( geometry, material )
    return object
  }
}


export {DXFLoader}