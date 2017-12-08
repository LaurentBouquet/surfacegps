// Copyright (C) 2017 Laurent Bouquet
// 
// This file is part of SurfaceGPS.
// 
// SurfaceGPS is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// SurfaceGPS is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with SurfaceGPS.  If not, see <http://www.gnu.org/licenses/>.
// 

import { Component } from '@angular/core';
import { IonicPage, ModalController, NavController, Events } from 'ionic-angular';

import { Item } from '../../models/item';
import { Items } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-list-master',
  templateUrl: 'list-master.html'
})
export class ListMasterPage {
  currentItems: Item[];

  constructor(private navCtrl: NavController, private items: Items, private modalCtrl: ModalController, private events: Events) {
    this.events.subscribe('items:loaded', (data, date) => {
      this.currentItems = data;  
    });
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() { 
  }

  /**
   * Prompt the user to add a new item. This shows our ItemCreatePage in a
   * modal and then adds the new item to our data source if the user created one.
   */
  addItem() {
    let addModal = this.modalCtrl.create('ItemCreatePage');
    addModal.onDidDismiss(item_data => {
      if (item_data) {
        let item = new Item();
        item.name = item_data.name;
        item.about = item_data.about;
        item.image = item_data.image;
        this.items.add(item);
      }
    })
    addModal.present();
    this.currentItems = this.items.query();
  }

  /**
   * Delete an item from the list of items.
   */
  deleteItem(item) {
    this.items.delete(item);
    this.currentItems = this.items.query();
  }

  /**
   * Navigate to the detail page for this item.
   */
  openItem(item: Item) {
    this.navCtrl.push('ItemDetailPage', {
      item: item
    });
  }
}
