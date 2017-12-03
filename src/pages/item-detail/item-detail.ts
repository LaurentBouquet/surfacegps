import { Component } from '@angular/core';
import { AlertOptions, IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Geolocation, } from '@ionic-native/geolocation';
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
import { Settings } from '../../providers/providers';

import { Items } from '../../providers/providers';
import { Item, Point } from '../../models/item';

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
  isPositionGetting: Boolean = false;

  watchId: any;

  constructor(public navCtrl: NavController, private translate: TranslateService, public viewCtrl: ViewController, navParams: NavParams, settings: Settings, private toastCtrl: ToastController, public alertCtrl: AlertController, private items: Items, private geolocation: Geolocation, public googleMaps: GoogleMaps) {
    
    // Item
    this.item = navParams.get('item') || items.defaultItem;
    
    // Settings
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
    
    // Translation
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

  /**
   * Show a Toast (a little text popup) 
   * on the top of the smartphone screen
   */
  private presentToast(message: string, duration: number = 3000) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: duration,
      position: 'top'
    });
    toast.present();
  }

  /**
   * Add the actual GPS position 
   * to the list of position "pointsGoogle[]"
   */
  public addCurrentPosition() {
    if (this.currentStep>2) { return; }  
    this.isPositionGetting = true;
    this.getPosition().then((currentPoint) => {
        this.presentToast('Position: ' + currentPoint.latitude + ', ' + currentPoint.longitude); 
        this.item.addPoint(currentPoint.latitude, currentPoint.longitude);   
        this.pointsGoogle.push(new LatLng(currentPoint.latitude, currentPoint.longitude));
        this.drawPolygon();  
        this.item.step = this.setCurrentStep(); 
        this.calcSurface(this.item);
        this.items.save(this.item);  
        this.isPositionGetting = false;
    }).catch((error)=> {
        this.presentToast(error); 
        this.isPositionGetting = false; 
    });  
  }

  /**
   * Get the actual GPS position (only one position)
   */
  private getPosition(): Promise<Point> {    
    let promise = new Promise<Point>((resolve, reject) => {
      this.geolocation.getCurrentPosition({enableHighAccuracy: true}).then((resp) => {        
        resolve(new Point(resp.coords.latitude, resp.coords.longitude));
      }).catch((error) => {
        reject('Error getting location ' + error.message);
      });
    });  
    return promise; 
  }


  /**
   * Show a popup to continue watching GPS position
   * or to delete all points and start a new watching 
   */
  public recordPoints() {
    this.isPositionGetting = false;
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
   * Start watching GPS position 
   * and save it in the list of position "pointsGoogle[]"
   */
  public watchPosition(): void {
    this.isPositionRecording = true;
    this.presentToast(this.lang.START_RECORDING);
    let options = {
      enableHighAccuracy: this.enableHighAccuracy,
      timeout: 30000,
      maximumAge: 0
    };
    this.watchId = navigator.geolocation.watchPosition((position) => { 
      this.presentToast(position.coords.longitude + ' - ' + position.coords.latitude, 1000);
      this.item.addPoint(position.coords.latitude, position.coords.longitude);     
      this.pointsGoogle.push(new LatLng(position.coords.latitude, position.coords.longitude));
      this.drawPolygon();  
      this.item.step = this.setCurrentStep();     
    }, (error) => {
      this.presentToast(error);  
    }, options);
  }

  /**
   * Stop watching GPS position
   */  
  public unwatchPosition(): void {  
    this.isPositionRecording = false;   
    this.presentToast(this.lang.STOP_RECORDING); 
    navigator.geolocation.clearWatch(this.watchId);      
    this.item.step = this.setCurrentStep();   
    this.calcSurface(this.item);
    this.items.save(this.item); 
  }


  /*
   * Set the step (currentStep) value according to the number of points
   * (NoPosition, OneOrTwoPosition, ManyPositions or AreaCalculated)
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
   * Save the current "Item" object
   */
  private savePiece(item:Item) {
    this.items.save(item).then((resp)=>{
      // Nothing to do
    }).catch((error)=>{
      this.presentToast('Error saving piece ' + error.message);       
    });
  }

  /**
   * Initialize the Google Map, load all points, and draw the polygon on it
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
    if (this.mapGoogle != undefined) {
      // Wait the MAP_READY before using any methods.
      this.mapGoogle.one(GoogleMapsEvent.MAP_READY).then(() => {  
        this.isMapReady = true;
        if (this.currentStep>2) {
          this.isCalcReady = true;
        } else {
          this.isCalcReady = false;
        }    
        let currentPointGoogle: LatLng;
        for(var i=0; i<this.item.points.length; i++) { 
          currentPointGoogle = new LatLng(this.item.points[i].latitude, this.item.points[i].longitude);
          this.pointsGoogle.push(currentPointGoogle);
        }             
        this.drawPolygon();
      }).catch((error) => {
        this.presentToast('Error initializing map ' + error.message);
      });     
    } 
  }
    
  /**
   * Call the Google Map function "addPolygon()" to draw a polygon on the map, representing the piece
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
          }; 
          this.mapGoogle.addPolygon(polygonOptions).then((resp) => {  
            // Nothing to do            
          }).catch((error) => {
            this.presentToast('Error adding polyline ' + error.message);        
          });        
        } 
      }
    }).catch((error)=>{
      this.presentToast('Error drawing polygon ' + error.message);       
    });
  }

  /**
   * Call the Google Map function "computeArea()" to calc the surface of the piece from positions
   */
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
   * Show a popup to confirm deletion of all points of the piece 
   */
  public confirmDeleteAllPoints(item:Item) {
    let confirm = this.alertCtrl.create({
      title: this.lang.CLEAN_BUTTON + ' "' + item.name + '"',
      message: this.lang.QUESTION_CONFIRM_DELETE_ALL_POSITIONS,
      buttons: [
        {
          text: this.lang.CANCEL_BUTTON,
          handler: () => {
            // Nothing to do 
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

  /**
   * Function called by confirmDeleteAllPoints()
   */
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
   * Show a popup to confirm deletion of the piece
   */
  public deletePiece(item:Item) {
    let confirm = this.alertCtrl.create({
      title: this.lang.DELETE_BUTTON + ' "' + item.name + '"',
      message: this.lang.QUESTION_CONFIRM_DELETE_PIECE,
      buttons: [
        {
          text: this.lang.CANCEL_BUTTON,
          handler: () => {
            // Nothing to do
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
   * Show a popup to display details of the piece (name, about, points number, surface)
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

}
