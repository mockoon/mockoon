class CommandPalette {
  public get commandPaletteModal() {
    return $('.command-palette-modal');
  }
  public get searchInput() {
    return $('.command-palette-modal input[type="text"]');
  }

  public get commandsList() {
    return $('.command-palette-modal .command-list');
  }

  public async open() {
    await $('#openCommandPalette').click();
  }

  public async assertVisible(reverse = false) {
    const commandPalette = await this.commandPaletteModal;

    if (reverse) {
      await expect(commandPalette).not.toBeDisplayed();

      return;
    }

    await expect(commandPalette).toBeDisplayed();
  }

  public async search(text: string) {
    const searchBox = await $('.command-palette-modal input[type="text"]');
    await searchBox.setValue(text);
    // wait for list refresh
    await browser.pause(100);
  }

  public async countCommands(expectedLength: number) {
    const commandList = await this.commandsList;
    const commands = await commandList.$$('.list-group-item');
    await expect(commands).toHaveLength(expectedLength);
  }

  public async executeCommandClick(index: number) {
    const commandList = await this.commandsList;
    const command = await commandList.$(`.list-group-item:nth-child(${index})`);
    await command.click();
  }

  /**
   *
   * @param id - command palette command ID from command-palette.service.ts
   */
  public async executeCommandClickById(id: string) {
    const commandList = await this.commandsList;
    const command = await commandList.$(`#${id}`);
    await command.click();
  }

  public async assertActiveCommand(expectedIndex: number) {
    const commandList = await this.commandsList;
    const command = await commandList.$(
      `.list-group-item:nth-child(${expectedIndex})`
    );
    await expect(command).toHaveElementClass('active');
  }
}

export default new CommandPalette();
