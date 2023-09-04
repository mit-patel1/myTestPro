import sparrow.settings as settings
from win32 import win32security


class Impersonate:
    def __init__(self, is_customer):
        self.is_customer = is_customer

    def __enter__(self):
        if self.is_customer and settings.IS_TEST_SITE:
            pass

        elif self.is_customer and settings.IS_LIVE:
            self.handel = win32security.LogonUser(settings.IMPERSONATE_CUSTOMER_USERNAME, settings.IMPERSONATE_CUSTOMER_SERVER, settings.IMPERSONATE_CUSTOMER_PWD, 9, 3)
            win32security.ImpersonateLoggedOnUser(self.handel)
        else:
            self.handel = win32security.LogonUser(settings.IMPERSONATE_USERNAME, settings.IMPERSONATE_SERVER, settings.IMPERSONATE_PWD, 9, 3)
            win32security.ImpersonateLoggedOnUser(self.handel)

    def __exit__(self, type, value, traceback):
        if self.is_customer and settings.IS_TEST_SITE:
            pass
        else:
            win32security.RevertToSelf()
            self.handel.Close()

class FileServerImpersonate:
    def __init__(self, file_server):
        self.file_server = file_server

    def __enter__(self):
        self.IMPERSONATE_SERVER = self.file_server["FileServerPath"].split('\\')[2].upper()
        self.handel = win32security.LogonUser(self.file_server["ImpersonatUsername"], self.IMPERSONATE_SERVER, self.file_server["ImpersonatPassword"], 9, 3)
        win32security.ImpersonateLoggedOnUser(self.handel)

    def __exit__(self, type, value, traceback):
        win32security.RevertToSelf()
        self.handel.Close()
