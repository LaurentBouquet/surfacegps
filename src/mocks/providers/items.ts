/**
 * Service that manages creating instances of Item
 */

 import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { ToastController, Events } from 'ionic-angular';

import { Item } from '../../models/item';

const DATABASE_FILE_NAME: string = 'data.db';

@Injectable()
export class Items { 
  
  private items: Item[] = [];
  private db: SQLiteObject;

  defaultItem: any = {
    "rowid": 0,
    "name": "Unknow",
    "about": "",
    "image": "",
    "points": [],
    "surface": 0,
    "step": 0
  };

  constructor(private sqlite: SQLite, private toastCtrl: ToastController, public events: Events) {
   this.createDatabaseFile();    
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
   * Create a SQLite database file (if it does not exist)
   */
  private createDatabaseFile(): void { 
    this.sqlite.create({
      name: DATABASE_FILE_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.debug('Database: ' + DATABASE_FILE_NAME);
        this.db = db;
        this.createTables();
      })
      .catch(e => this.presentToast(e.message)); 
  }

  /**
   * Create table "pieces" (if not exists) in SQLite database
   */  
  private createTables(): void {
    this.db.executeSql('CREATE TABLE IF NOT EXISTS "pieces" ( `rowid` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `about` TEXT NOT NULL, `image` BLOB, `points` BLOB, `surface` REAL NOT NULL DEFAULT 0, `step` INTEGER NOT NULL DEFAULT 0  ) ;', {})
      .then(() => {
        console.debug('Table "pieces" OK');
        this.getData();
      })
      .catch(e => this.presentToast(e.message));
  }

  /**
   * Get all items from SQLite database
   */  
  public getData(): Item[] {
      this.db.executeSql('SELECT * FROM pieces ORDER BY name ASC ;', {})
      .then((data: any) => { 
        this.items = [];
        console.debug(data.rows.length);
        for(var i=0; i<data.rows.length; i++) { 
          let row = data.rows.item(i);
          let item = new Item();
          item.rowid = row.rowid;
          item.name = row.name;          
          if (row.about != NaN) {
            item.about = row.about;
          }
          item.image = row.image;

          let sql_points = JSON.parse(row.points);          
          if (sql_points != null) {
            for(var j=0; j<sql_points.length; j++) {
              item.addPoint(sql_points[j].latitude, sql_points[j].longitude);
            }
          }

          item.surface = row.surface; 
          item.step = row.step;

          this.items.push(item);
        }
        this.events.publish('items:loaded', this.items, Date.now());
      })
      .catch(e => this.presentToast(e.message));  
    return this.items;
  }

  /**
   * Search for a term in the items name
   * and return the list of items that match
   */    
  public query(params?: any): Item[] {
    if (!params) {
      return this.items;
    }
    return this.items.filter((item) => {
      for (let key in params) {
        let field = item[key];
        if (typeof field == 'string' && field.toLowerCase().indexOf(params[key].toLowerCase()) >= 0) {
          return item;
        } else if (field == params[key]) {
          return item;
        }
      }
      return null; 
    });
  }

  /**
   * Insert item ("Item" object) in SQLite database
   */
  public add(item: Item) {
    let data = [item.name, item.about, item.image, JSON.stringify(item.points), item.surface ? item.surface : 0, item.step ? item.step : 0];    
    this.db.executeSql('INSERT INTO pieces (name, about, image, points, surface, step) VALUES (?, ?, ?, ?, ?, ?) ;', data)
      .then((res) => {
        item.rowid = res.insertId;
        this.items.push(item); 
      })
      .catch(e => this.presentToast(e.message));
  }

  /**
   * Save item ("Item" object) in SQLite database
   */
  public save(item: Item): Promise<string> {
    let promise = new Promise<string>((resolve, reject) => {
      try {
        let data = [item.name, item.about, item.image, JSON.stringify(item.points), item.surface ? item.surface : 0, item.step ? item.step : 0, item.rowid];    
        this.db.executeSql('UPDATE pieces SET name=?, about=?, image=?, points=?, surface=?, step=? WHERE rowid=?   ;', data)
          .then(() => console.log('Piece "'+item.name+'" updated'))
          .catch(e => this.presentToast(e.message));
        resolve('Item saved');    
      } catch (error) {
        reject('Error saving item: ' + error.message);  
      }
    });  
    return promise; 
  }

  /**
   * Delete item ("Item" object) in SQLite database
   */
  public delete(item: Item) {
    let data = [item.rowid];    
    this.db.executeSql('DELETE FROM pieces WHERE rowid=? ;', data)
    .then(() => {
      console.log('Piece "'+item.name+'" deleted');
      this.items.splice(this.items.indexOf(item), 1);      
    })
    .catch(e => this.presentToast(e.message));
  }

}
