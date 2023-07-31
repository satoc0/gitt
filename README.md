# Gitt

The Gitt is a tool that helps you manage multiple Git repositories simultaneously by allowing you to execute the same command on all configured repositories. This can save you time and effort when performing repetitive tasks across multiple repositories.

## Features

- Configure multiple Git repositories to manage.
- Execute the same Git command on all configured repositories with a single command.
- Easily add or remove repositories from the configuration.

## Installation

1. Make sure you have [Node.js](https://nodejs.org) v14 installed on your system.
2. Clone this repository or download the source code.
3. Navigate to the project directory in your terminal.
4. Install the required dependencies by running the following command:
   ```
   npm install
   npm run build
   ```
5. Create a symbolic link to the CLI tool by running:
   ```
   npm link
   ```

## Usage

### Configuration

Navigate to the parent folder that have the repo's and run:

```
gitt setup
```

Select the repo's that you want, and done!

You can configure the repositories you want to manage. Use the following command to add a repository:

```
gitt status add
gitt status remove
```

### Executing Git Commands

Gitt just wrap git commands for you, unless `clone`, all git commands will be available.

Example:

```
$ gitt add .
$ gitt commit -m "my message"
$ gitt pull
```

### List Configured Repositories

To view a list of all currently configured repositories, run:

```
gitt setup
```

### Help

If you ever need help or want to see the available commands, you can use:

```
gitt --help
```

## Contribution

Contributions to this project are always welcome. If you find any issues or want to suggest improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/your-username/git-repo-manager).

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

The Gitt was inspired by the need to efficiently manage multiple repositories and streamline common Git tasks.

---
