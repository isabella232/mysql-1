import * as core from '@actions/core';

import { run } from "../src/main";
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import AzureMySqlAction from '../src/AzureMySqlAction';
import AzureMySqlActionHelper from '../src/AzureMySqlActionHelper';
import MySqlConnectionStringBuilder from '../src/MySqlConnectionStringBuilder';
import FirewallManager from '../src/FirewallManager';
import AzureMySqlResourceManager from '../src/AzureMySqlResourceManager';
import MySqlUtils from '../src/MySqlUtils';

import { getInputMock } from './getInputMockHelper'

jest.mock('@actions/core');
jest.mock('azure-actions-webclient/AuthorizerFactory');
jest.mock('../src/AzureMySqlAction');
jest.mock('../src/FirewallManager');
jest.mock('../src/AzureMySqlResourceManager');

jest.mock('../src/MySqlConnectionStringBuilder', () => {
    return jest.fn().mockImplementation(() => {
        return {
            server: 'testmysqlserver.mysql.database.azure.com'
        }
    })
});

describe('main.ng.ts tests', () => {
    it('gets inputs and runs sql file', async () => {
        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                [ 'username', 'testuser@testmysqlserver'],
                [ 'password', 'testpassword'],
                [ 'database', 'testdb'],
                ['sql-file', './testsqlfile.sql'],
                ['arguments', '-t 10']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "";
        });

        await run();

        expect(AzureMySqlAction).toHaveBeenCalled();
        expect(detectIPAddressSpy).toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalled();
        expect(getResourceManagerSpy).not.toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).not.toHaveBeenCalled();
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
        expect(setFailedSpy).not.toHaveBeenCalled();
    })

    it('throws error if sql file path is invalid', async () => {
        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                [ 'username', 'testuser@testmysqlserver'],
                [ 'password', 'testpassword'],
                [ 'database', 'testdb'],
                ['sql-file', './testsqlfile.sql'],
                ['arguments', '-t 10']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.random');

        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "";
        });

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(detectIPAddressSpy).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();

        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).not.toHaveBeenCalled();
        expect(setFailedSpy).toHaveBeenCalledWith('Invalid sql file path provided as input ./testsqlfile.random');
    });

    it('add firewall rule when its not already configured', async () => {
        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                ['connection-string', 'testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred'],
                ['sql-file', './testsqlfile.sql'],
                ['arguments', '-t 10']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "1.2.3.4";
        });

        await run();

        expect(AzureMySqlAction).toHaveBeenCalled();
        expect(detectIPAddressSpy).toHaveBeenCalled();
        expect(getAuthorizerSpy).toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalled();
        expect(getResourceManagerSpy).toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).toHaveBeenCalled();
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(addFirewallRuleSpy).toHaveBeenCalled();
        expect(actionExecuteSpy).toHaveBeenCalled();
        expect(removeFirewallRuleSpy).toHaveBeenCalled();
        expect(setFailedSpy).not.toHaveBeenCalled();
    });

    it('cannot specify username and connection string same time', async () => {

        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                ['username', 'testuser@testmysqlserver'],
                ['password', 'testpassword'],
                ['database', 'testdb'],
                ['connection-string', 'testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred'],
                ['sql-file', './testsqlfile.sql'],
                ['arguments', '-t 10']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "";
        });

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(detectIPAddressSpy).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalled();
        expect(getResourceManagerSpy).not.toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).not.toHaveBeenCalled();
        expect(resolveFilePathSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
        expect(setFailedSpy).toHaveBeenCalledWith('Cannot specify both username and connection string');
    })

    it('Need to specify at least one auth definition', async () => {

        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                ['sql-file', './testsqlfile.sql'],
                ['arguments', '-t 10']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "";
        });

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(detectIPAddressSpy).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalled();
        expect(getResourceManagerSpy).not.toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).not.toHaveBeenCalled();
        expect(resolveFilePathSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
        expect(setFailedSpy).toHaveBeenCalledWith('Need to specify either username and password or connection-string');
    })

    it('Password not specified', async () => {

        const getInputSpy = getInputMock(core,
            new Map([
                ['server-name', 'testmysqlserver.mysql.database.azure.com'],
                ['username', 'testuser@testmysqlserver']
            ])
        );

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');
        let detectIPAddressSpy = MySqlUtils.detectIPAddress = jest.fn().mockImplementationOnce(() => {
            return "";
        });

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(detectIPAddressSpy).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalled();
        expect(getResourceManagerSpy).not.toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).not.toHaveBeenCalled();
        expect(resolveFilePathSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
        expect(setFailedSpy).toHaveBeenCalledWith('Input required and not supplied: missing');
    })
})