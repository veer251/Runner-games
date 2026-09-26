// ─── TOON / CEL-SHADING TOOLKIT ──────────────────────────────────────────────
// Anime look: MeshToonMaterial + stepped gradient maps + inverted-hull outlines.
'use strict';

const Toon = (() => {
  let gradientMaps = {};

  function C(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  // Stepped gradient map for hard cel bands
  function gradientMap(steps=4){
    if(gradientMaps[steps]) return gradientMaps[steps];
    const cv=document.createElement('canvas'); cv.width=steps; cv.height=1;
    const ctx=cv.getContext('2d');
    for(let i=0;i<steps;i++){
      // ramp from dark to light in discrete bands
      const v=Math.round(60 + (i/(steps-1))*195);
      ctx.fillStyle=`rgb(${v},${v},${v})`;
      ctx.fillRect(i,0,1,1);
    }
    const tex=new THREE.CanvasTexture(cv);
    tex.minFilter=THREE.NearestFilter; tex.magFilter=THREE.NearestFilter;
    tex.generateMipmaps=false;
    gradientMaps[steps]=tex;
    return tex;
  }

  // Toon material
  function mat(color, opts={}){
    const m=new THREE.MeshToonMaterial({
      color: C(color),
      gradientMap: gradientMap(opts.steps||4),
    });
    if(opts.emissive){ m.emissive=C(opts.emissive); m.emissiveIntensity=opts.emissiveIntensity||1; }
    if(opts.map){ m.map=opts.map; }
    if(opts.transparent){ m.transparent=true; m.opacity=opts.opacity!==undefined?opts.opacity:1; }
    return m;
  }

  // Inverted-hull outline: clone geometry, render backfaces in dark, scaled out along normals.
  function outline(mesh, thickness=0.03, color='#141414'){
    if(!mesh.geometry) return null;
    const outlineMat=new THREE.ShaderMaterial({
      uniforms:{ outlineColor:{value:C(color)}, thickness:{value:thickness} },
      vertexShader:`
        uniform float thickness;
        void main(){
          vec3 n = normalize(normalMatrix * normal);
          vec4 p = modelViewMatrix * vec4(position,1.0);
          p.xyz += normalize(n) * thickness * (-p.z) * 0.15;
          gl_Position = projectionMatrix * p;
        }`,
      fragmentShader:`
        uniform vec3 outlineColor;
        void main(){ gl_FragColor=vec4(outlineColor,1.0);
          #include <encodings_fragment>
        }`,
      side:THREE.BackSide,
    });
    const o=new THREE.Mesh(mesh.geometry, outlineMat);
    o.userData.isOutline=true;
    mesh.add(o);
    return o;
  }

  // Convert a whole group's MeshStandardMaterials to toon + add outlines.
  function apply(root, opts={}){
    const thickness=opts.thickness!==undefined?opts.thickness:0.02;
    const outlineColor=opts.outlineColor||'#141414';
    const outlineAll=opts.outlineAll!==false;
    root.traverse(o=>{
      if(o.isMesh && o.material && !o.userData.isOutline && !o.userData.noToon){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        const newMats=mats.map(sm=>{
          if(sm.isMeshToonMaterial||sm.isSprite) return sm;
          const tm=new THREE.MeshToonMaterial({
            color: sm.color?sm.color.clone():C('#ffffff'),
            gradientMap: gradientMap(opts.steps||4),
            map: sm.map||null,
            transparent: sm.transparent,
            opacity: sm.opacity,
          });
          if(sm.emissive && sm.emissiveIntensity>0){ tm.emissive=sm.emissive.clone(); tm.emissiveIntensity=sm.emissiveIntensity; }
          return tm;
        });
        o.material=Array.isArray(o.material)?newMats:newMats[0];
        if(outlineAll && thickness>0 && !o.userData.noOutline){
          outline(o, thickness, outlineColor);
        }
      }
    });
    return root;
  }

  return { mat, outline, apply, gradientMap };
})();

window.Toon = Toon;
