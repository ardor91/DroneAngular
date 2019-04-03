import * as THREE from 'three';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class AttitudeService {
    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private light: THREE.AmbientLight;
  
    private cube: THREE.Mesh;
  
    createScene(elementId: string): void {
      // The first step is to get the reference of the canvas element from our HTML document
      this.canvas = <HTMLCanvasElement>document.getElementById(elementId);
  
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,    // transparent background
        antialias: true // smooth edges
      });
      this.renderer.setSize(this.canvas.height, this.canvas.width);
  
      // create the scene
      this.scene = new THREE.Scene();
  
      this.camera = new THREE.PerspectiveCamera(
        75, this.canvas.width / this.canvas.height, 0.1, 1000
      );
      this.camera.position.z = 5;
      //this.camera.position.y = 5;
      //this.camera.rotation.x = 0;
      //this.camera.rotation.y = 0;
      //this.camera.rotation.z = 0;
      //this.rotateObject(this.camera, 0, 0, 0);
      this.scene.add(this.camera);
  
      // soft white light
      this.light = new THREE.AmbientLight( 0x404040 );
      this.light.position.z = 10;
      this.scene.add(this.light);
  
      let geometry = new THREE.BoxGeometry(1, 1, 1);
      let material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      this.cube = new THREE.Mesh( geometry, material );
      this.cube.position.set( 0, 0, 10 );
      //this.rotateObject(this.cube, 0, 0, 0);

      this.scene.add(this.cube);


      let blueColor = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      let greenColor = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

      let color1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      let color2 = new THREE.MeshBasicMaterial({ color: 0x666666 });
      let color3 = new THREE.MeshBasicMaterial({ color: 0x666666 });
      let color4 = new THREE.MeshBasicMaterial({ color: 0x0000ff });

      let planeDown = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1500, 900, 4, 4 ), greenColor );
      planeDown.position.set( 0, -10, -250 );
      this.rotateObject(planeDown, -90, 0, 0);
      this.scene.add( planeDown );

      let planeForward = new THREE.Mesh( new THREE.PlaneBufferGeometry( 900, 900, 4, 4 ), blueColor );
      planeForward.position.set( 0, 0, -500 );
      this.scene.add( planeForward );

      let planeBackward = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1500, 900, 4, 4 ), blueColor );
      planeBackward.position.set( 0, 0, 250 );
      this.rotateObject(planeBackward, 0, 180, 0);
      this.scene.add( planeBackward );

      let planeLeft = new THREE.Mesh( new THREE.PlaneBufferGeometry( 900, 900, 1, 1 ), blueColor );
      planeLeft.position.set( -450, 0, -250 );
      this.rotateObject(planeLeft, 0, 90, 0);
      this.scene.add( planeLeft );

      let planeRight = new THREE.Mesh( new THREE.PlaneBufferGeometry( 900, 900, 4, 4 ), blueColor );
      planeRight.position.set( 450, 0, -250 );
      this.rotateObject(planeRight, 0, -90, 0);
      this.scene.add( planeRight );

      let planeTop = new THREE.Mesh( new THREE.PlaneBufferGeometry( 900, 900, 4, 4 ), blueColor );
      planeTop.position.set( 0, 250, -250 );
      this.rotateObject(planeTop, 90, 0, 0);
      this.scene.add( planeTop );
  
    }

     rotateObject(object, degreeX=0, degreeY=0, degreeZ=0) {
       //console.log(THREE.Math.degToRad(90));
        if(degreeX != 0) object.rotation.x = THREE.Math.degToRad(degreeX);
        if(degreeY != 0) object.rotation.y = THREE.Math.degToRad(degreeY);
        if(degreeZ != 0) object.rotation.z = THREE.Math.degToRad(degreeZ);
     }
     
  
    animate(): void {
      window.addEventListener('DOMContentLoaded', () => {
        this.render();
      });
  
      window.addEventListener('resize', () => {
        this.resize();
      });
    }
  
    render() {
      /*requestAnimationFrame(() => {
        this.render();
      });*/
  
      //this.cube.rotation.x += 0.01;
      //this.cube.rotation.y += 0.01;
      this.renderer.render(this.scene, this.camera);
    }  

    rotateCamera(roll, pitch, yaw) {
      if(!this.camera) return;
      this.camera.rotation.z = roll;
      this.camera.rotation.x = -pitch;
      this.camera.rotation.y = -yaw;
      this.cube.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z - 5);
      this.cube.applyMatrix(this.camera.matrixWorld);
      requestAnimationFrame(() => {
        this.render();
      });
    }
  
    resize() {
      let width = this.canvas.width;
      let height = this.canvas.height;
  
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
  
      this.renderer.setSize( width, height );
    }
  }