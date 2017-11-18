import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
//import { Storage } from '@ionic/storage';
//import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { Items } from '../../providers/providers';

export enum Step {NoPosition, OneOrTwoPosition, ManyPositions, AreaCalculated}

@IonicPage()
@Component({
  selector: 'page-item-detail',
  templateUrl: 'item-detail.html'
})

export class ItemDetailPage {
  item: any;
  currentStep: Step = Step.NoPosition;

  constructor(public navCtrl: NavController, navParams: NavParams, items: Items, private geolocation: Geolocation) {
    this.item = navParams.get('item') || items.defaultItem;
  }

  /**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  getPosition() {
    if (this.currentStep>2) { return; }
    console.log('savePosition()');
    this.geolocation.getCurrentPosition().then((resp) => {
      console.log('latitude = ' + resp.coords.latitude);
      console.log('longitude = ' + resp.coords.longitude);
     }).catch((error) => {
       console.log('Error getting location', error);
     });
    
  }

  /**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  savePiece(item) {
    console.log('savePiece('+item.name+')');
  }

}
