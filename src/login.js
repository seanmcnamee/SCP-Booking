const { By, Builder, Browser } = require('selenium-webdriver');
const assert = require("assert");

const config = require('config');


(async function firstTest() {
  let driver;

  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get(config.get('website'));

    await driver.manage().setTimeouts({ implicit: 500 });

    const navBurgerMenu = await driver.findElement(By.id('menu-button'));
    await navBurgerMenu.click();

    //// Navigate to Family Camping
    const headerMenuItems = await driver.findElements(By.css('#header-top li:has(.menuitem)'));
    const menuItemSearch = await findByText(headerMenuItems, 'SEARCH');

    if (menuItemSearch) {
      const menuItemText = await menuItemSearch.getText();
      console.log("Found! ", menuItemText);

      await menuItemSearch.click();
    } else {
      console.log("Not found...");
    }

    const subMenuItems = await menuItemSearch.findElements(By.css('.submenu a.menuitem'));
    const menuItemFamilyCamping = await findByText(subMenuItems, 'Family Camping');
    if (menuItemFamilyCamping) {
      const familyCampingText = await menuItemFamilyCamping.getText();
      console.log("Found! ", familyCampingText);

      await menuItemFamilyCamping.click();
    } else {
      console.log("Not found...");
    }

    //Apply filters
    const filtersToggleButton = await driver.findElement(By.css('button.collapse-icon'));
    await filtersToggleButton.click();

    //Begin Date    
    const beginDateToggle = await driver.findElement(By.id('begindate_vm_6_button'));
    await beginDateToggle.click();

    //Begin Date - Month
    const beginDateMonthToggle = await driver.findElement(By.css('button#begindate_vm_6_month_selection_button'));
    await beginDateMonthToggle.click();
    const beginDateMonthOptions = await driver.findElements(By.css('button#begindate_vm_6_month_selection_button + div > ul > li'))
    const desiredMonth = await findByText(beginDateMonthOptions, config.get('filters.beginDate.month'));
    await desiredMonth.click();
    
    //Begin Date - Day
    const beginDateDayToggle = await driver.findElement(By.css('button#begindate_vm_6_day_selection_button'));
    await beginDateDayToggle.click();
    const beginDateDayOptions = await driver.findElements(By.css('button#begindate_vm_6_day_selection_button + div > ul > li'))
    const desiredDay = await findByText(beginDateDayOptions, config.get('filters.beginDate.day'));
    await desiredDay.click();
    
    //Begin Date - Year
    const beginDateYearToggle = await driver.findElement(By.css('button#begindate_vm_6_year_selection_button'));
    await beginDateYearToggle.click();
    const beginDateYearOptions = await driver.findElements(By.css('button#begindate_vm_6_year_selection_button + div > ul > li'))
    const desiredYear = await findByText(beginDateYearOptions, config.get('filters.beginDate.year'));
    await desiredYear.click();

    const beginDateButtons = await driver.findElements(By.css('#begindate_vm_6_wrap button'))
    const beginDateDoneButton = await findByText(beginDateButtons, 'Done');
    await beginDateDoneButton.click();

    //Nights
    const nightsToggle = await driver.findElement(By.css('button#nights_vm_1_button'));
    await nightsToggle.click();
    const nightsOptions = await driver.findElements(By.css('button#nights_vm_1_button + div > ul > li'))
    const desiredNight = await findByText(nightsOptions, config.get('filters.nights'));
    await desiredNight.click();

    //Park
    const parksOptions = await driver.findElements(By.css('#category_vm_2_wrap ul > li'));
    const desiredPark = await findByText(parksOptions, config.get('filters.park'));
    await desiredPark.click();

    //Apply filters
    const searchButton = await driver.findElement(By.css('button#rnwebsearch_buttonsearch'));
    await searchButton.click();

    //Diplay option
    const displayTypeToggle = await driver.findElement(By.css('button#display_vm_5_button'));
    await displayTypeToggle.click();
    const displayTypeOptions = await driver.findElements(By.css('button#display_vm_5_button + div > ul > li'))
    const desiredDisplayType = await findByText(displayTypeOptions, 'Graphical');
    await desiredDisplayType.click();
    
    //Select first available of desired sites
    const allSites = await driver.findElements(By.css('div.graphical-inner.ui-draggable.ui-draggable-handle > a'))
    const allSitesAndDataTitle = await Promise.all(allSites.map(async site => ({
      site: site,
      dataTitle: await site.getAttribute("data-title")
    })));

    const desiredSiteStrList = config.get('desiredSiteList');
    const desiredSites = desiredSiteStrList.map(desiredSiteStr => 
      allSitesAndDataTitle.find(x => x.dataTitle.includes(desiredSiteStr))
    );

    for (let desiredSite of desiredSites) {
      //TODO: Check if "Status: Available" and click 

      console.log("Desired Site: ", desiredSite.dataTitle);
    }

    // let menuItemFamilyCamping;
    // for (let subMenuItem of subMenuItems) {
    //   const subMenuItemText = await subMenuItem.getText();
    //   console.log('SubMenu item: ', subMenuItemText);
    //   // if (subMenuItemText === 'SEARCH') {
    //   //   menuItemFamilyCamping = subMenuItem;
    //   //   break;
    //   // }
    // }


    // let title = await driver.getTitle();
    // assert.equal("Web form", title);

    // await driver.manage().setTimeouts({implicit: 500});

    // let textBox = await driver.findElement(By.name('my-text'));
    // let submitButton = await driver.findElement(By.css('button'));

    // await textBox.sendKeys('Selenium');
    // await submitButton.click();

    // let message = await driver.findElement(By.id('message'));
    // let value = await message.getText();
    // assert.equal("Received!", value);


  } catch (e) {
    console.log(e)
  } finally {
    // await driver.quit();
  }
}());



async function findByText(elements, text) {
  for (let el of elements) {
    const elText = await el.getText();
    if (elText === text) {
      return el;
    }
  }
}