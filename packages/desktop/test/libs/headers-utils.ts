import { Header } from '@mockoon/commons';
import utils from '../libs/utils';

type HeaderLocations =
  | 'route-response-headers'
  | 'response-callback-headers'
  | 'environment-headers'
  | 'env-proxy-req-headers'
  | 'env-proxy-res-headers';

class HeadersUtils {
  public get secondaryBtn() {
    return $('.add-header-secondary');
  }

  public getLine(location: HeaderLocations, index: number) {
    return $(
      `app-headers-list#${location} .headers-list .header-item:nth-of-type(${index})`
    );
  }

  public getAddButton(location: HeaderLocations) {
    return $(`app-headers-list#${location} button.add-header`);
  }

  public async add(location: HeaderLocations, header: Header) {
    const headersComponentSelector = `app-headers-list#${location}`;
    const inputsSelector = `${headersComponentSelector} .headers-list .header-item:last-of-type input:nth-of-type`;

    await this.getAddButton(location).click();
    await utils.setElementValue($(`${inputsSelector}(1)`), header.key);
    await utils.setElementValue($(`${inputsSelector}(2)`), header.value);
  }

  public async remove(location: HeaderLocations, index: number) {
    const deleteButton = $(
      `app-headers-list#${location} .headers-list .header-item:nth-of-type(${index}) button`
    );

    // click and confirm
    await deleteButton.click();
    await deleteButton.click();
  }

  public async assertCount(location: HeaderLocations, expected: number) {
    await utils.countElements(
      $$(`app-headers-list#${location} .headers-list .header-item`),
      expected
    );
  }

  public async assertHeadersValues(
    location: HeaderLocations,
    values: { [key in string]: string | undefined }
  ) {
    const keyInputs = await $$(
      `app-headers-list#${location} .headers-list .header-item input:first-of-type`
    );
    const valueInputs = await $$(
      `app-headers-list#${location} .headers-list .header-item input:last-of-type`
    );
    const headers = {};

    for (let index = 0; index < keyInputs.length; index++) {
      const key = (await keyInputs[index].getValue()).toLowerCase();
      const value = (await valueInputs[index].getValue()).toLowerCase();

      headers[key] = value;
    }

    for (const key in values) {
      expect(headers[key.toLowerCase()]).toEqual(
        values[key] ? values[key].toLowerCase() : undefined
      );
    }
  }

  public async clickCORSButton(location: HeaderLocations) {
    await $(`app-headers-list#${location} button.add-header-secondary`).click();
  }
}

export default new HeadersUtils();
