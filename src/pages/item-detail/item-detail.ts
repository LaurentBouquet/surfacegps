//import { promisify } from '@ionic/app-scripts/dist/util/promisify';
import { Component } from '@angular/core';
import { AlertOptions, IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Geolocation, } from '@ionic-native/geolocation';
//import { Geoposition } from '@ionic-native/geolocation';
import { ViewController, ToastController, AlertController } from 'ionic-angular';
import {
    GoogleMap,
    GoogleMapOptions,
    GoogleMaps,
    GoogleMapsEvent,
    LatLng,
    PolygonOptions,
    Spherical,
} from '@ionic-native/google-maps';
//import { Marker, PolylineOptions } from '@ionic-native/google-maps';
//import { Observable } from 'rxjs/Observable';
import { Settings } from '../../providers/providers';

import { Items } from '../../providers/providers';
import { Item, Point } from '../../models/item';
//import { Observable } from 'rxjs/Observable';

export enum Step {NoPosition, OneOrTwoPosition, ManyPositions, AreaCalculated}

declare var navigator: any;

@IonicPage()
@Component({
  selector: 'page-item-detail',
  templateUrl: 'item-detail.html'
})

export class ItemDetailPage { 
  lang: any; 
  item: Item;
  currentStep: Step = Step.NoPosition;
  enableHighAccuracy:Boolean = false;
  mapZoom:Number = 18;
  mapGoogle: GoogleMap;
  pointsGoogle:Array<LatLng> = [];
  isMapReady: Boolean = false;
  isCalcReady: Boolean = false;
  isPositionRecording: Boolean = false;

  watchId: any;

  constructor(public navCtrl: NavController, private translate: TranslateService, public viewCtrl: ViewController, navParams: NavParams, settings: Settings, private toastCtrl: ToastController, public alertCtrl: AlertController, private items: Items, private geolocation: Geolocation, public googleMaps: GoogleMaps) {
    
    //item
    this.item = navParams.get('item') || items.defaultItem;
    
    //settings
    settings.getValue('option5').then(
      val => {
        this.enableHighAccuracy = val;
      }
    ).catch( val => {
      this.enableHighAccuracy = false;
    });
    settings.getValue('option3').then(
      val => {
        this.mapZoom = val;
      }
    ).catch( val => {
      this.mapZoom = 18;
    });
    
    //translation
    this.translate.get([
        'FORM_GPS_POINTS_NUMBER', 
        'FORM_SURFACE', 
        'CLOSE_BUTTON',
        'RESTART_BUTTON',
        'CONTINUE_BUTTON',
        'CANCEL_BUTTON',
        'DELETE_BUTTON',
        'CLEAN_BUTTON',
        'RECORDING_POSITIONS',
        'QUESTION_START_RECORDING_AGAIN_OR_CONTINUE',
        'QUESTION_CONFIRM_DELETE_PIECE',
        'QUESTION_CONFIRM_DELETE_ALL_POSITIONS',
        'START_RECORDING',
        'STOP_RECORDING',
        'ALL_POSITIONS_ARE_DELETED'
      ]).subscribe(text => {
      this.lang = text;
    });      
  }

  ionViewDidEnter() {
    if (this.item.points.length>0) {
      this.initMap(new Point(this.item.points[0].latitude, this.item.points[0].longitude), this.mapZoom);      
    } else {
      this.getPosition().then((currentPoint) => {
        this.initMap(currentPoint, this.mapZoom);        
      }).catch((error)=> {
          this.presentToast(error);  
      });       
    }
    this.setCurrentStep();          
  }

  ionViewWillUnload() {
    this.savePiece(this.item);
  }

  private presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    /*  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });  
    */
    toast.present();
  }

  /**
   * 
   */
  /*public addCurrentPosition() {
    //this.presentToast("" + this.item.name);
    if (this.currentStep>2) { return; }  
    this.getPosition().then((currentPoint) => {
        this.presentToast('Position: ' + currentPoint.latitude + ', ' + currentPoint.longitude); 
        this.item.addPoint(currentPoint.latitude, currentPoint.longitude);   
        this.pointsGoogle.push(new LatLng(currentPoint.latitude, currentPoint.longitude));
        this.drawPolygon();  
        this.item.step = this.setCurrentStep();     
        this.items.save(this.item);  
    }).catch((error)=> {
        this.presentToast(error);  
    });  
  }*/

  /**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  private getPosition(): Promise<Point> {
    let promise = new Promise<Point>((resolve, reject) => {
      this.geolocation.getCurrentPosition({enableHighAccuracy: true}).then((resp) => {        
        resolve(new Point(resp.coords.latitude, resp.coords.longitude));
      }).catch((error) => {
        //this.presentToast('Error getting location ' + error.message);
        reject('Error getting location ' + error.message);
      });
    });  
    return promise; 
  }


  /**
   * 
   */
  public recordPoints() {
    if (this.item.points.length>0) {
      let confirm = this.alertCtrl.create({
        title: this.lang.RECORDING_POSITIONS,
        message: this.lang.QUESTION_START_RECORDING_AGAIN_OR_CONTINUE,
        buttons: [
          {
            text: this.lang.RESTART_BUTTON,
            handler: () => {
              this.deleteAllPoints().then((result) => {
                this.presentToast(result);  
                this.watchPosition();  
              }).catch ((error)=>{
                this.presentToast(error);    
              });
            }
          },
          {
            text: this.lang.CONTINUE_BUTTON,
            handler: () => {                       
              this.watchPosition();  
            }
          }
        ]
      });
      confirm.present();
    } 
    else{
      this.watchPosition();   
    }    
  }    

/**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  public watchPosition(): void {
    this.isPositionRecording = true;
    this.presentToast(this.lang.START_RECORDING);
    let options = {
      enableHighAccuracy: this.enableHighAccuracy,
      timeout: 30000,
      maximumAge: 0
    };
    ///this.getPosition().then((currentPoint) => {
      // Add watch
      this.watchId = navigator.geolocation.watchPosition((position) => { 
        this.presentToast(position.coords.longitude + ' - ' + position.coords.latitude);
        this.item.addPoint(position.coords.latitude, position.coords.longitude);     
        this.pointsGoogle.push(new LatLng(position.coords.latitude, position.coords.longitude));
        this.drawPolygon();  
        this.item.step = this.setCurrentStep();     
        //this.items.save(this.item); 
      }, (error) => {
        this.presentToast(error);  
      }, options);
    ///}).catch((error)=> {
        ///this.presentToast(error);  
    ///});        
  }

  public unwatchPosition(): void {  
    this.isPositionRecording = false;   
    this.presentToast(this.lang.STOP_RECORDING); 
    //this.getPosition().then((currentPoint) => {         
      navigator.geolocation.clearWatch(this.watchId);      
      //this.presentToast('Watching position is stopping');
      this.item.step = this.setCurrentStep();   
      this.calcSurface(this.item);
      this.items.save(this.item); 
    /*}).catch((error)=> {
        this.presentToast(error);  
    });*/
  }


  /*
   * Set currentStep value according to the number of points
   */
  private setCurrentStep(): Step {
    if (this.item.points == null) {
      this.currentStep = Step.NoPosition;  
    } else {
      if (this.currentStep<3) {
        switch(this.item.points.length) { 
          case 0: { 
            this.currentStep = Step.NoPosition;
            break; 
          } 
          case 1: { 
            this.currentStep = Step.OneOrTwoPosition;
            break; 
          } 
          case 2: {
            this.currentStep = Step.OneOrTwoPosition;
            break;    
          } 
          default: { 
            this.currentStep = Step.ManyPositions;
            break;              
          } 
        }
      }
    }
    this.isCalcReady = false;
    if (this.currentStep>1 && !this.isPositionRecording) {
        this.isCalcReady = this.isMapReady;
    } 
    return this.currentStep;
  }


  /**
   * 
   */
  private savePiece(item:Item) {
    this.items.save(item).then((resp)=>{
      //Nothing to do
    }).catch((error)=>{
      this.presentToast('Error saving piece ' + error.message);       
    });
  }

    /**
   * 
   */
  private initMap(startPoint:Point, mapZoom) {
    let mapOptions: GoogleMapOptions = {
      camera: {
        target: {
          lat: startPoint.latitude,
          lng: startPoint.longitude
        },
        zoom: mapZoom,
        tilt: 30
      }
    };
    let element: HTMLElement = document.getElementById('map');
    this.mapGoogle = GoogleMaps.create(element, mapOptions);  
    // Wait the MAP_READY before using any methods.
    if (this.mapGoogle != undefined) {
      this.mapGoogle.one(GoogleMapsEvent.MAP_READY).then(() => {  
        //this.presentToast("MAP is ready !");  
        this.isMapReady = true;
        if (this.currentStep>2) {
          this.isCalcReady = true;
        } else {
          this.isCalcReady = false;
        }    
        let currentPointGoogle: LatLng;
        for(var i=0; i<this.item.points.length; i++) { 
          //this.presentToast("(" + item.points[i].latitude + ", " + item.points[i].longitude + ")");  
          // GoogleMaps
          currentPointGoogle = new LatLng(this.item.points[i].latitude, this.item.points[i].longitude);
          this.pointsGoogle.push(currentPointGoogle);
        }             
        this.drawPolygon();
        //this.calcSurface(this.item);
      }).catch((error) => {
        this.presentToast('Error initializing map ' + error.message);
      });     
    } 
  }
    
  /**
   * 
   */
  public drawPolygon() {
    //this.items.save(item); //Don't execute this action
    this.mapGoogle.clear().then((resp)=>{
      if (this.item.points.length>0) {         
        if (this.mapGoogle != undefined) {  
          let polygonOptions:PolygonOptions = {
            'points': this.pointsGoogle, 
            'strokeColor': '#5555FF',
            'strokeWidth': 1,
            'fillColor': '#81E082'
          }; //khaki="#f0e68c" / red="#ff0000" / 'black' / 'red'
          this.mapGoogle.addPolygon(polygonOptions).then((resp) => {  
            //Nothing to do            
          }).catch((error) => {
            this.presentToast('Error adding polyline ' + error.message);        
          });        
        } 
      }
    }).catch((error)=>{
      this.presentToast('Error drawing polygon ' + error.message);       
    });
  }

  public calcSurface(item:Item) {
    if (this.item.points.length>0) {
      let currentSphericalGoogle: Spherical = new Spherical();
      let surface = currentSphericalGoogle.computeArea(this.pointsGoogle);
      item.surface = new Number(surface.toFixed(2)).valueOf();
    }
    else {
      item.surface = 0;
    }
    this.items.save(item);
    this.presentToast(this.lang.FORM_SURFACE + " " + item.surface + " m²"); 
  }


  /**
   * 
   */
  public confirmDeleteAllPoints(item:Item) {
    let confirm = this.alertCtrl.create({
      title: this.lang.CLEAN_BUTTON + ' "' + item.name + '"',
      message: this.lang.QUESTION_CONFIRM_DELETE_ALL_POSITIONS,
      buttons: [
        {
          text: this.lang.CANCEL_BUTTON,
          handler: () => {
            //nothing
          }
        },
        {
          text: this.lang.CLEAN_BUTTON,
          handler: () => {  
            this.deleteAllPoints().then((result) => {
              this.presentToast(result);  
            }).catch ((error)=>{
              this.presentToast(error);    
            });
          }
        }
      ]
    });
    confirm.present();  
  }

  private deleteAllPoints(): Promise<string> {
    let promise = new Promise<string>((resolve, reject) => {
      try {
        this.pointsGoogle = [];
        this.item.points = [];
        this.item.surface = 0;
        this.item.step = this.setCurrentStep();     
        this.items.save(this.item).then((resp)=>{
          this.mapGoogle.clear().then((resp)=>{
            resolve(this.lang.ALL_POSITIONS_ARE_DELETED);    
          }).catch((error)=>{
            reject('Error deleting all points: ' + error.message);  
          });          
        }).catch((error)=>{
          reject('Error deleting all points: ' + error.message);  
        });
        
      } catch (error) {
        reject('Error deleting all points: ' + error.message);  
      }
    });  
    return promise; 
  } 

  /**
   * 
   */
  public deletePiece(item:Item) {
    //Êtes-vous sûr de vouloir supprimer définitivement cette pièce?
    let confirm = this.alertCtrl.create({
      title: this.lang.DELETE_BUTTON + ' "' + item.name + '"',
      message: this.lang.QUESTION_CONFIRM_DELETE_PIECE,
      buttons: [
        {
          text: this.lang.CANCEL_BUTTON,
          handler: () => {
            //nothing
          }
        },
        {
          text: this.lang.DELETE_BUTTON,
          handler: () => {            
            this.items.delete(item);
            this.viewCtrl.dismiss();
          }
        }
      ]
    });
    confirm.present();
  }  

  /**
   * 
   */
  public showDetails(item:Item) {
    let opts:AlertOptions = {
      title: item.name,
      subTitle: '<br>' + item.about 
      + '<br><br>' + this.lang.FORM_GPS_POINTS_NUMBER + ' ' + item.points.length
      + '<br><br>' + this.lang.FORM_SURFACE + ' ' + item.surface + ' m²',
      buttons: [this.lang.CLOSE_BUTTON]
    };
    let alert = this.alertCtrl.create(opts);
    alert.present();

    
  }

  /*
    translate.get(["TUTORIAL_SLIDE1_TITLE",
      "TUTORIAL_SLIDE1_DESCRIPTION",
      "TUTORIAL_SLIDE2_TITLE",
      "TUTORIAL_SLIDE2_DESCRIPTION",
      "TUTORIAL_SLIDE3_TITLE",
      "TUTORIAL_SLIDE3_DESCRIPTION",
    ]).subscribe((values) => {
      console.log('Loaded values', values);
      this.slides = [
        {
          title: values.TUTORIAL_SLIDE1_TITLE,
          description: values.TUTORIAL_SLIDE1_DESCRIPTION,
          image: 'assets/img/ica-slidebox-img-1.png',
        }
      ];
    });
    */

}
