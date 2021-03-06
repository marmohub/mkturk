import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css'
import { Utils } from './utils';
import { Charts } from './charts';

const storage = firebase.storage();
const stroageRef = storage.ref();

const DATA_PATH = 'mkturkfiles/datafiles/'
const DATA_REF = stroageRef.child(DATA_PATH);
const PARAM_PATH = 'mkturkfiles/parameterfiles/subjects/';
const PARAM_REF = stroageRef.child(PARAM_PATH);
const utils = new Utils;

export class Liveplot {
  public file: any;
  public editor: JSONEditor;
  public charts: Charts;

  constructor(elemObj: any) {

    this.file = {
      path: DATA_PATH,
      list: [],
      name: '',
      data: null,
      ver: null,
      date: null,
      dataChanged: false,
      fileChanged: false
    };

    this.charts = new Charts(elemObj);
  }

  public fileSelectionChangedListener(elem: HTMLSelectElement) {
    elem.addEventListener('input', (evt: Event) => {
      evt.stopPropagation();
      evt.preventDefault();
      this.file.name = this.file.fileList[parseInt(elem.value)].fullpath;
      this.file.fileChanged = true;
      console.log('file name:', this.file.name);
      console.log('file path:', this.file.path);
    });
  }

  public async populateFileList(elem: HTMLSelectElement) {
    try {
      let fileList = await utils.getFileList(this.file.path);

      fileList.sort((a: any, b: any) => {
        let nameA = a.name.toUpperCase();
        let nameB = b.name.toUpperCase();

        if (nameA > nameB) {
          return -1;
        }

        if (nameA < nameB) {
          return 1;
        }

        return 0;
      });

      this.file.fileList = fileList;

      for (let i = 0; i < fileList.length; i++) {
        let opt = document.createElement('option');
        opt.value = i.toString();
        opt.innerHTML = fileList[i].name;
        elem.appendChild(opt);
      }

      this.file.name = this.file.fileList[0].fullpath;
      this.file.fileChanged = true;
      this.file.data = (
        this.flattenData(await utils.getStorageFile(this.file.name))
      );
      this.processData(this.file.data);

      this.loadDataToEditor(this.file.data);

    } catch (error) {
      console.error('ERROR #file-list:', error);
    }


  }

  private flattenData(data: any) {

    let tmp: any = {};

    for (let outerKey in data) {
      if (data.hasOwnProperty(outerKey)) {
        for (let innerKey in data[outerKey]) {
          if (data[outerKey].hasOwnProperty(innerKey)) {
            tmp[innerKey] = data[outerKey][innerKey];
          }
        }
      }
    }

    return tmp;
  }

  private async processData(data: any) {

    let metadata = await utils.getStorageFileMetadata(this.file.name);
    console.log('Success! Loaded File Size:', metadata.size / 1000, 'KB');
    this.file.ver = metadata.generation;
    this.file.dateSaved = new Date(metadata.updated);

    // this.file.data.CurrentDate = (
    //   new Date(this.file.data.CurrentDate).valueOf()
    // );

    if (this.file.fileChanged) {
      this.charts.initializeChartData(this.file);
    } else if (this.file.dataChanged) {
      this.charts.updatePlots();
    }
  }

  public setupEditor(elem: HTMLDivElement) {
    this.editor = new JSONEditor(elem);
  }

  private loadDataToEditor(data: any) {
    this.editor.set(data);
  }

}
