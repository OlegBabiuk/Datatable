import PhoneService from './phone-service.js';

class Datatable {
  constructor({
    element,
    items,
    columnConfig,
  }) {
    this.element = element;
    this.items = items;
    this.originalItems = items;
    this.columnConfig = columnConfig;
    this.searchFields = [];
    this._selectSearchFields();
    this.sortFlag = true;

    this._render();

    this.input = this._findElement('[data-search="input"]');
    this.mainCheckbox = this._findElement('[data-checkbox="main"]');
    this.btnGetSelected = this._findElement('[data-checkbox="push"]');

    this._bindThis();
    this._listOfListeners();
  }

  _routerFunction(event) {
    let target = event.target;

    if (target.closest('[data-sortable]')) {
      let parentCell = target.closest('[data-sortable]');
      this.sotrColumn(parentCell.dataset.sortable);
    }

    if (target.dataset.checkbox === 'common') {
      this.uncheck(target.checked);
    }

    if (target.dataset.etitable === 'false') {
      this.cancelEdit(event);
    }
  }

  _bindThis() {
    this._routerFunction = this._routerFunction.bind(this);
    this.search = this.search.bind(this);
    this.selected = this.selected.bind(this);
    this.getSelected = this.getSelected.bind(this);
    this._editData = this._editData.bind(this);
    this._finishEdit = this._finishEdit.bind(this);
  }

  uncheck(status) {
    if (!status) {
      this.mainCheckbox.checked = status;
    }
  }

  sotrColumn(type) {
    if (this.sortFlag) {
      this.items = this.items.sort((item1, item2) => {
        return item1[type] < item2[type] ? 1 : -1;
      });
      this.sortFlag = false;

    } else {
      this.items = this.items.sort((item1, item2) => {
        return item1[type] > item2[type] ? 1 : -1;
      });
      this.sortFlag = true;
    }

    this._updateTbody();
  }

  _selectSearchFields() {
    Object.keys(this.columnConfig)
      .forEach(key => {
        if (this.columnConfig[key].isSearchable) {
          this.searchFields.push(key);
        }
      })
  }

  getSelected() {
    let checkboxs = this._findElements('[data-checkbox="common"]');
    let selected = [...checkboxs]
      .filter(item => item.checked)
      .map(item => {
        let key = item.dataset.element;

        return this.items.find(phone => phone.name === key);
      });

    console.log(selected)
  }

  search() {
    let searchText = this.input.value.toLowerCase();

    this.items = this.originalItems;
    this.items = this.items
      .filter(phone => {
        let resalt = [];
        for (let i = 0; i < this.searchFields.length; i++) {
          let key = this.searchFields[i];
          resalt.push(phone[key].toLowerCase().includes(searchText));
        }
        return resalt.some(flag => flag === true);
      })

    this._updateTbody();
  }

  selected(event) {
    const statusMainCheckbox = event.target.checked;
    let checkboxs = this._findElements('[data-checkbox="common"]');
    [...checkboxs].forEach(item => item.checked = statusMainCheckbox);
  }

  _editData(event) {
    let target = event.target;
    if (target.dataset.etitable === 'true') {
      if (target.contentEditable === 'true') {
        return;
      }
      this.saveEditData = target.textContent.trim();
      target.contentEditable = true;
      target.classList.add('statusEdit');
      target
        .closest('[data-element]')
        .insertAdjacentHTML(
          'beforeend',
          `<i data-etitable="false" class="finishEdit fas fa-times"></i>`
        );
      target.addEventListener('blur', this._finishEdit);
      target.addEventListener('keydown', this._finishEdit);
    }
  }

  _finishEdit(event) {
    if (event.key === "Enter" || event.type === "blur") {
      event.preventDefault();
      let target = event.target;

      if (target.nextElementSibling) {
        target.nextElementSibling.remove();
      }

      target.classList.remove('statusEdit');
      target.contentEditable = false;

      let itemKey = target
        .closest('[data-element]')
        .dataset
        .element;
      let currentItem = this.items
        .find(phone => phone[itemKey] === this.saveEditData);

      if (currentItem) {
        currentItem[itemKey] = target.textContent.trim();
      }
    }
  }

  cancelEdit(event) {
    let span = event.target.previousElementSibling;
    span.classList.remove('statusEdit');
    span.contentEditable = false;
    event.target.remove();
    span.textContent = this.saveEditData;
  }

  _toFormTheadRow() {
    return (
      Object.entries(this.columnConfig)
      .map(([key, value]) => {
        return `
          <th
            ${(value.isSortable)
              ? `data-sortable="${key}"`
              : ''
            }
            ${(value.isSearchable)
              ? `data-searchable="${key}"`
              : ''
            }
          >
            <span>
              ${value.title}
              ${(value.isSortable)
                ? '<i class="fas fa-angle-down"></i>'
                : ''
              }
            </span>
          </th>`;

      }).join('')
    );
  }

  _toFormTbodyRow(phone) {
    return `
      <tr data-element="row">
        ${ Object.keys(this.columnConfig)
            .map(key => `
              <td
                data-element="${ key}"
              >
                <span data-etitable="true">
                  ${phone[key]}
                </span>
              </td>`)
            .join('')
        }
        <td>
          <input
            data-checkbox="common"
            data-element="${phone.name}"
            type="checkbox"
            name="select">
        </td>
      </tr>`;
  }

  _updateTbody() {
    this.tbody = this._findElement('[data-element="tbody"]');
    this.tbody.innerHTML = `
      ${this.items.map(phone => this._toFormTbodyRow(phone)).join('')}
    `;
  }

  _findElement(attribute) {
    return this.element.querySelector(attribute);
  }

  _findElements(attribute) {
    return this.element.querySelectorAll(attribute);
  }

  _listOfListeners() {
    this.element.addEventListener('click', this._routerFunction);
    this.element.addEventListener('dblclick', this._editData);
    this.input.addEventListener('input', this.search);
    this.mainCheckbox.addEventListener('input', this.selected);
    this.btnGetSelected.addEventListener('click', this.getSelected);
  }

  _render() {
    this.element.innerHTML = `
      <div class="search-panel">
        <button data-checkbox="push">getSelected</button>
        <label>
          Search
          <input data-search="input">
        </label>
      </div>
      <table class="table">
        <thead>
          <tr>
            ${this._toFormTheadRow()}
            <th>
              <input
                data-checkbox="main" 
                type="checkbox" 
                name="select"
              >
            </th>
          </tr>
        </thead>
        <tbody data-element="tbody">
          ${this.items.map(phone => this._toFormTbodyRow(phone)).join('')}
        </tbody>
      </table>`;
  }
}


const initDatatable = async () => {
  let phones = await PhoneService.getData();

  const datatable = new Datatable({
    element: document.querySelector('.datatable'),
    items: phones,

    columnConfig: {
      name: {
        title: 'Название', // в таблице колонка будет так называться 
        isSortable: true, // Поиск будет проверять эту и последнюю колонки 
        isSearchable: true,
      },
      age: {
        title: 'Возраст',
        isSortable: true, // по этой колонке можно сортировать
      },
      snippet: { // Только для тех ключей которые есть в columnConfig будут колонки в таблице
        title: 'Описание',
        isSearchable: true, // В этой колонке тоже будет происходить поиск query
      }
    }
  });
};

initDatatable();