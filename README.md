# CSV Edit in Obsidian

> [!CAUTION]
> 
> | CRUDE CSV |                                                                                                |
> | --------- | ---------------------------------------------------------------------------------------------- |
> |           | Transforms your CSV files into an interactive spreadsheet view.                                |
> |           |                                                                                                |
> |           | **C**reate, **R**ead, **U**pdate, **D**elete, **E**dit (and **N**ew) directly within Obsidian. |
> |           |                                                                                                |
> |           | Crude. Isn't it ?!                                                                             |
> 
> ---
---

> [!NOTE]
> 
> ## Features
> 
> - View CSV files as table with proper row numbers
> - Create new CSV files - even with a template!
> - Edit cells directly by clicking on them
> - Real-time updates that automatically save to your CSV file
> 
> ---
> 
> - Insert new data rows with the `+R` button
> - Delete the last row with the `-R` button
> - Expand your table with the `+C` button
> - Trim columns with the `-C` button
>
> ---
>
> - Intelligent parsing that handles quoted fields and special characters
> 	-  98.74ˉ11% of cases work perfectly – don't use line breaks in cells 💩
> - Proper handling of empty cells and missing data
>
> ---
>
> - Seamlessly integrates with Obsidian's theming system
> - Usefull on small screens as well as on mobile devices
> - Automatically registers `.csv` files to open in the CRUDE CSV viewer
> ---
---

> [!CAUTION]
> [Screenshot dark mode](scr_dark.png) & [Screenshot light mode](scr_light.png)
> ---
---

> [!IMPORTANT]
> **Installation**
>
> - ~~clone repo, build, copy (`<vault>/.obsidian/plugins/crude-csv/`)~~
> - **Use the community plugins search** ==> <ins>recommended</ins>!
> ## afterwards:
> 	- Enable the plugin in Obsidian's Community Plugins settings
> 	- Enable "Detect all file extensions" (`Settings > Files & Links`)
>   - **CSV files will now open in the CRUDE CSV viewer**
> ---
---

> [!TIP]
>
> **Opening CSV Files**
>
> - Click on a `.csv` file in your vault
>   - it will automatically opens the file in the spreadsheet view
>
> **Create a new CSV File**
>
> - Use or right click the **file explorer**, choose **Ribon icon** or the **command palette** to create a new CSV file in your vault
>   - it will automatically opens the file in the spreadsheet view
>
> **Use a Table template**
>
> - Exits a `template.csv` in your Template-Folder (Core plugin or Templater) it will be used as scheme for new files
> - _You can also set one in the plugin settings_
>   - if not found, exists nor set, new files got a "mini content"
>     - MINI = 1st row with A, B and a 2nd row with 1, 2
>
> **Editing Data**
>
> - **Edit**: Click on a cell to edit
> - **Add/Remove**: Use the toolbar buttons to add/del rows or columns as needed
>
> **Toolbar**
>
> - `+R` - Add a new row at the bottom of the table
> - `-R` - Remove the last row from the table
> - `+C` - Add a new column to the right
> - `-C` - Remove the rightmost column
> - _Prevention from deleting all cells and having an empty file - 1 cell is minimum and still remains_
> ---
---

> [!CAUTION]
> **Technical Details**
>
> - Built with TypeScript for robust type safety
> - **Zero external dependencies** - Lightweight. And fast!
> - Non extras included!
> - CSS for mostly all Screen sizes and device platforms
> - Extends Obsidian's `TextFileView` for seamless file integration
> - Uses Obsidian's native styling system for consistent theming
> - Automatically saves changes back to the original CSV file
>
> **Requirements**
>
> - Obsidian v1.4.16 or higher
>
> **Contributing**
>
> - Issues and pull requests are welcome!
> - Aim to make CSV editing as smooth as possible with a little QoL inside Obsidian.
>
> **License**
>
> - <ins>unlicense</ins> -> see [LICENSE](LICENSE.md) (for details)
> ---
---

> [!NOTE]
>
> ## Reasons for creating and choosing this plugin over others
>
> - Many disappointed me
> - Some didn’t work, or work proper
> - A few were not what I expected
>
> ## Hopefully someone else enjoys it as much as I do - The Author
> ---
---
